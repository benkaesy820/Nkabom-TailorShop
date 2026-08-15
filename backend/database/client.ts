import env from '#start/env'
import { connect, DatabaseError } from '@tursodatabase/serverless'

const databaseUrl = env.get('TURSO_DATABASE_URL')
const databaseHostGuard = env.get('TURSO_DATABASE_HOST_GUARD')
const parsedDatabaseUrl = new URL(databaseUrl)
if (parsedDatabaseUrl.protocol !== 'turso:') {
  throw new Error(`TURSO_DATABASE_URL must use turso://, received ${parsedDatabaseUrl.protocol}`)
}
if (parsedDatabaseUrl.hostname !== databaseHostGuard) {
  throw new Error(
    `TURSO_DATABASE_HOST_GUARD must match the configured database host (${parsedDatabaseUrl.hostname})`
  )
}

const databaseConfiguration = {
  url: databaseUrl,
  authToken: env.get('TURSO_AUTH_TOKEN'),
}

export type SqlValue = string | number | bigint | Uint8Array | null
export type SqlArguments = readonly SqlValue[]
export type DatabaseRunResult = {
  changes: number
}
export type DatabaseExecutor = {
  get(sql: string, args?: SqlArguments): Promise<unknown>
  all(sql: string, args?: SqlArguments): Promise<unknown[]>
  run(sql: string, args?: SqlArguments): Promise<DatabaseRunResult>
}

type TursoDatabase = ReturnType<typeof connect>

function firstColumnValue(row: unknown): unknown {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const values = Object.values(row)
  return values.length > 0 ? values[0] : null
}

async function directGet(
  connection: TursoDatabase,
  sql: string,
  args: SqlArguments = []
): Promise<unknown> {
  return connection.get(sql, ...args)
}

async function directAll(
  connection: TursoDatabase,
  sql: string,
  args: SqlArguments = []
): Promise<unknown[]> {
  const rows: unknown = await connection.all(sql, ...args)
  if (!Array.isArray(rows)) throw new Error('Database returned an invalid row set')
  return rows
}

async function directRun(
  connection: TursoDatabase,
  sql: string,
  args: SqlArguments = []
): Promise<DatabaseRunResult> {
  const result: unknown = await connection.run(sql, ...args)
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Database returned an invalid write result')
  }
  const changes = Reflect.get(result, 'changes')
  if (typeof changes !== 'number' || !Number.isSafeInteger(changes) || changes < 0) {
    throw new Error('Database returned an invalid change count')
  }
  return { changes }
}

function executorFor(connection: TursoDatabase): DatabaseExecutor {
  return {
    get: (sql, args) => directGet(connection, sql, args),
    all: (sql, args) => directAll(connection, sql, args),
    run: (sql, args) => directRun(connection, sql, args),
  }
}

async function configureConnection(connection: TursoDatabase): Promise<void> {
  await connection.exec('PRAGMA foreign_keys = ON')

  const foreignKeys = firstColumnValue(await directGet(connection, 'PRAGMA foreign_keys'))
  const normalizedForeignKeys = typeof foreignKeys === 'bigint' ? Number(foreignKeys) : foreignKeys
  if (normalizedForeignKeys !== 1) {
    throw new Error('Turso foreign-key enforcement is not enabled on this connection')
  }

  const journalMode = firstColumnValue(await directGet(connection, 'PRAGMA journal_mode'))
  if (typeof journalMode !== 'string' || journalMode.toLowerCase() !== 'mvcc') {
    throw new Error(
      `Turso concurrent writes require journal_mode=mvcc; run npm run db:migrate before starting the API`
    )
  }
}

class ManagedConnection implements DatabaseExecutor {
  readonly #connection: TursoDatabase
  #ready: Promise<void> | null = null

  constructor() {
    this.#connection = connect(databaseConfiguration)
    this.#connection.defaultSafeIntegers(true)
  }

  #ensureReady(): Promise<void> {
    if (!this.#ready) {
      const readiness = configureConnection(this.#connection)
      this.#ready = readiness
      void readiness.catch(() => {
        if (this.#ready === readiness) this.#ready = null
      })
    }
    return this.#ready
  }

  async #executeWithReconnect<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (!(error instanceof Error) || !/HTTP error! status: 404/i.test(error.message)) {
        throw error
      }

      await this.#connection.reconnect()
      this.#ready = null
      await this.#ensureReady()
      return operation()
    }
  }

  async get(sql: string, args: SqlArguments = []): Promise<unknown> {
    await this.#ensureReady()
    return this.#executeWithReconnect(() => directGet(this.#connection, sql, args))
  }

  async all(sql: string, args: SqlArguments = []): Promise<unknown[]> {
    await this.#ensureReady()
    return this.#executeWithReconnect(() => directAll(this.#connection, sql, args))
  }

  async run(sql: string, args: SqlArguments = []): Promise<DatabaseRunResult> {
    await this.#ensureReady()
    return this.#executeWithReconnect(() => directRun(this.#connection, sql, args))
  }

  async batch(...args: Parameters<TursoDatabase['batch']>) {
    await this.#ensureReady()
    return this.#executeWithReconnect(() => this.#connection.batch(...args))
  }
}

const poolSize = env.get('TURSO_CONNECTION_POOL_SIZE')
if (!Number.isSafeInteger(poolSize) || poolSize < 1 || poolSize > 32) {
  throw new Error('TURSO_CONNECTION_POOL_SIZE must be an integer between 1 and 32')
}

const connections = Array.from({ length: poolSize }, () => new ManagedConnection())
let connectionCursor = 0

export function databaseConnection(): ManagedConnection {
  const connection = connections.at(connectionCursor)
  connectionCursor = (connectionCursor + 1) % connections.length
  if (!connection) throw new Error('Turso connection pool is unexpectedly empty')
  return connection
}

const conflictPattern = /SQLITE_BUSY|BUSY_SNAPSHOT|transaction.*conflict|write.*conflict/i

export function isTursoConflict(error: unknown): boolean {
  if (error instanceof DatabaseError) {
    return Boolean(error.code?.startsWith('SQLITE_BUSY')) || conflictPattern.test(error.message)
  }
  return error instanceof Error && conflictPattern.test(error.message)
}

export async function retryTursoConflict<T>(
  operation: () => Promise<T>,
  maxAttempts = 4
): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await operation()
    } catch (error) {
      attempt += 1
      if (attempt >= maxAttempts || !isTursoConflict(error)) throw error
      const delayMs = 12 * 2 ** (attempt - 1) + Math.floor(Math.random() * 12)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export async function withConcurrentTransaction<T>(
  operation: (executor: DatabaseExecutor) => Promise<T>
): Promise<T> {
  return retryTursoConflict(async () => {
    const connection = connect(databaseConfiguration)
    connection.defaultSafeIntegers(true)
    try {
      await configureConnection(connection)
      await connection.exec('BEGIN IMMEDIATE')
      try {
        const result = await operation(executorFor(connection))
        await connection.exec('COMMIT')
        return result
      } catch (error) {
        try {
          await connection.exec('ROLLBACK')
        } catch {
          // Closing the dedicated connection below discards any remaining transaction state.
        }
        throw error
      }
    } finally {
      await connection.close()
    }
  })
}
