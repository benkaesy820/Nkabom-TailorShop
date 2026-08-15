import { connect } from '@tursodatabase/serverless'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const root = fileURLToPath(new URL('../', import.meta.url))
const migrationsDirectory = join(root, 'database', 'migrations')
const supportedCommands = ['migrate', 'status', 'reset']

function configuration() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  const expectedHost = process.env.TURSO_DATABASE_HOST_GUARD
  if (!url) throw new Error('TURSO_DATABASE_URL is required')
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is required')
  if (!expectedHost) throw new Error('TURSO_DATABASE_HOST_GUARD is required')

  const parsed = new URL(url)
  if (parsed.protocol !== 'turso:') {
    throw new Error(
      `Refusing database operation: expected a turso:// URL, received ${parsed.protocol}`
    )
  }
  if (parsed.hostname !== expectedHost) {
    throw new Error(
      `Refusing database operation: expected host ${expectedHost}, received ${parsed.hostname}`
    )
  }

  return { url, authToken, host: parsed.hostname }
}

async function migrationFiles() {
  const files = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort()
  return Promise.all(
    files.map(async (name) => {
      const sql = await readFile(join(migrationsDirectory, name), 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')
      const statements = sql
        .split(/^\s*-- statement-breakpoint\s*$/m)
        .map((statement) => statement.trim())
        .filter(Boolean)
      if (statements.length === 0) throw new Error(`Migration ${name} contains no SQL statements`)
      return { name, checksum, statements }
    })
  )
}

async function queryGet(db, sql, args = []) {
  const statement = await db.prepare(sql)
  return statement.get(args)
}

async function queryAll(db, sql, args = []) {
  const statement = await db.prepare(sql)
  const rows = await statement.all(args)
  if (!Array.isArray(rows)) throw new Error('Database returned an invalid row set')
  return rows
}

function firstColumnValue(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const values = Object.values(row)
  return values.length > 0 ? values[0] : null
}

function sqlTextLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`
}

async function currentJournalMode(db) {
  const row = await queryGet(db, 'PRAGMA journal_mode')
  const mode = firstColumnValue(row)
  if (typeof mode !== 'string') throw new Error('Unable to read Turso journal_mode')
  return mode.toLowerCase()
}

async function configureDatabase(
  db,
  { enableConcurrentWrites = false, enableForeignKeys = true } = {}
) {
  if (enableForeignKeys) {
    await db.exec('PRAGMA foreign_keys = ON')
    const foreignKeys = firstColumnValue(await queryGet(db, 'PRAGMA foreign_keys'))
    const normalizedForeignKeys =
      typeof foreignKeys === 'bigint' ? Number(foreignKeys) : foreignKeys
    if (normalizedForeignKeys !== 1) {
      throw new Error('Turso foreign-key enforcement could not be enabled')
    }
  }
  if (enableConcurrentWrites) {
    const mode = await currentJournalMode(db)
    if (mode !== 'mvcc') {
      throw new Error(
        `Concurrent writes require Turso MVCC journal mode; database reported ${mode}`
      )
    }
  }
}

async function ensureMigrationTable(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS _schema_migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT`)
}

async function appliedMigrations(db) {
  const rows = await queryAll(
    db,
    'SELECT name, checksum, applied_at FROM _schema_migrations ORDER BY name'
  )
  const applied = new Map()
  for (const row of rows) {
    const name = Reflect.get(row, 'name')
    const checksum = Reflect.get(row, 'checksum')
    const appliedAt = Reflect.get(row, 'applied_at')
    if (typeof name !== 'string' || typeof checksum !== 'string' || typeof appliedAt !== 'string') {
      throw new Error('Invalid row in _schema_migrations')
    }
    applied.set(name, { checksum, appliedAt })
  }
  return applied
}

async function migrate(db) {
  await ensureMigrationTable(db)
  const files = await migrationFiles()
  const applied = await appliedMigrations(db)

  for (const migration of files) {
    const existing = applied.get(migration.name)
    if (existing) {
      if (existing.checksum !== migration.checksum) {
        throw new Error(`Migration ${migration.name} changed after it was applied`)
      }
      continue
    }

    const appliedAt = new Date().toISOString()
    await db.batch(
      [
        ...migration.statements,
        `INSERT INTO _schema_migrations (name, checksum, applied_at) VALUES (${sqlTextLiteral(migration.name)}, ${sqlTextLiteral(migration.checksum)}, ${sqlTextLiteral(appliedAt)})`,
      ],
      'immediate'
    )
    console.log(`Applied ${migration.name}`)
  }
}

async function status(db) {
  await ensureMigrationTable(db)
  const files = await migrationFiles()
  const applied = await appliedMigrations(db)
  for (const migration of files) {
    const record = applied.get(migration.name)
    const state = !record
      ? 'pending'
      : record.checksum === migration.checksum
        ? 'applied'
        : 'changed'
    console.log(`${state.padEnd(8)} ${migration.name}${record ? `  ${record.appliedAt}` : ''}`)
  }
}

async function confirmReset(host) {
  if (process.argv.includes('--force')) return
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Reset requires an interactive terminal or the explicit --force flag')
  }
  const prompt = createInterface({ input: stdin, output: stdout })
  const answer = await prompt.question(
    `Type ${host} to permanently reset this development Turso database: `
  )
  prompt.close()
  if (answer !== host) throw new Error('Database reset cancelled')
}

async function reset(db, host) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Database reset is allowed only when NODE_ENV=development')
  }
  await confirmReset(host)
  await db.batch(
    [
      'DROP TABLE IF EXISTS idempotency_records',
      'DROP TABLE IF EXISTS realtime_events',
      'DROP TABLE IF EXISTS realtime_recipient_sequences',
      'DROP TABLE IF EXISTS seller_applications',
      'DROP TABLE IF EXISTS auth_action_tokens',
      'DROP TABLE IF EXISTS users',
      'DROP TABLE IF EXISTS _schema_migrations',
    ],
    'immediate'
  )
  await migrate(db)
}

async function main() {
  const command = process.argv[2]
  if (!supportedCommands.includes(command)) {
    throw new Error(`Expected one of: ${supportedCommands.join(', ')}`)
  }

  const config = configuration()
  const db = connect({ url: config.url, authToken: config.authToken })
  console.log(`Turso host: ${config.host}`)

  try {
    await configureDatabase(db, {
      enableConcurrentWrites: command !== 'status',
      enableForeignKeys: command === 'status',
    })

    switch (command) {
      case 'migrate':
        await migrate(db)
        break
      case 'status':
        console.log(`Journal mode: ${await currentJournalMode(db)}`)
        await status(db)
        break
      case 'reset':
        await reset(db, config.host)
        break
    }
  } finally {
    await db.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
