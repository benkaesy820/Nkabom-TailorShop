import { databaseConnection, type DatabaseExecutor } from '#database/client'
import { asRecord } from '#database/row'
import { DomainError } from '#exceptions/domain_error'
import User, { type AccountRole, type AccountStatus } from '#models/user'

export const userColumns = `
  id, full_name, email, password, role, account_status,
  email_verified_at, created_at, updated_at, version
`

export async function findUserById(
  id: number,
  executor: DatabaseExecutor = databaseConnection()
): Promise<User | null> {
  const row: unknown = await executor.get(`SELECT ${userColumns} FROM users WHERE id = ?`, [id])
  return row ? User.fromRow(row) : null
}

export async function findUserByEmail(
  email: string,
  executor: DatabaseExecutor = databaseConnection()
): Promise<User | null> {
  const row: unknown = await executor.get(
    `SELECT ${userColumns} FROM users WHERE email = ? COLLATE NOCASE`,
    [email]
  )
  return row ? User.fromRow(row) : null
}

export async function createUser(input: {
  fullName: string | null
  email: string
  passwordHash: string
}): Promise<User> {
  const now = new Date().toISOString()
  await databaseConnection().run(
    `INSERT INTO users (
      full_name, email, password, role, account_status, created_at, updated_at
    ) VALUES (?, ?, ?, 'normal', 'active', ?, ?)`,
    [input.fullName, input.email, input.passwordHash, now, now]
  )

  const user = await findUserByEmail(input.email)
  if (!user) throw new Error('User was not available after creation')
  return user
}

export async function markEmailVerified(userId: number): Promise<void> {
  const now = new Date().toISOString()
  await databaseConnection().run(
    `UPDATE users SET email_verified_at = ?, updated_at = ?, version = version + 1 WHERE id = ?`,
    [now, now, userId]
  )
}

export async function updatePassword(userId: number, passwordHash: string): Promise<void> {
  const now = new Date().toISOString()
  await databaseConnection().run(
    `UPDATE users SET password = ?, updated_at = ?, version = version + 1 WHERE id = ?`,
    [passwordHash, now, userId]
  )
}

export async function listUsers(limit = 200): Promise<User[]> {
  const rows: unknown[] = await databaseConnection().all(
    `SELECT ${userColumns} FROM users ORDER BY created_at DESC, id DESC LIMIT ?`,
    [limit]
  )
  return rows.map(User.fromRow)
}

export async function updateUserAdministrationInTransaction(
  executor: DatabaseExecutor,
  input: {
    userId: number
    expectedVersion: number
    role: AccountRole
    accountStatus: AccountStatus
  }
): Promise<User> {
  const existing = await findUserById(input.userId, executor)
  if (!existing) throw new DomainError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.')
  if (existing.version !== input.expectedVersion) {
    throw new DomainError(
      409,
      'STALE_ACCOUNT_VERSION',
      'This account changed after it was loaded. Refresh the account before saving.'
    )
  }

  const now = new Date().toISOString()
  const result = await executor.run(
    `UPDATE users
     SET role = ?, account_status = ?, updated_at = ?, version = version + 1
     WHERE id = ?
       AND version = ?
       AND NOT (
         role = 'administrator'
         AND account_status = 'active'
         AND (? <> 'administrator' OR ? <> 'active')
         AND (
           SELECT COUNT(*)
           FROM users
           WHERE role = 'administrator' AND account_status = 'active'
         ) <= 1
       )`,
    [
      input.role,
      input.accountStatus,
      now,
      input.userId,
      input.expectedVersion,
      input.role,
      input.accountStatus,
    ]
  )

  if (result.changes !== 1) {
    const current = await findUserById(input.userId, executor)
    if (!current) throw new DomainError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.')
    if (current.version !== input.expectedVersion) {
      throw new DomainError(
        409,
        'STALE_ACCOUNT_VERSION',
        'This account changed after it was loaded. Refresh the account before saving.'
      )
    }
    throw new DomainError(
      409,
      'LAST_ACTIVE_ADMINISTRATOR',
      'The last active administrator cannot be demoted or made inactive.'
    )
  }

  const updated = await findUserById(input.userId, executor)
  if (!updated) throw new Error('Account disappeared after update')
  return updated
}

export async function countUsersByRole(): Promise<Record<AccountRole, number>> {
  const rows: unknown[] = await databaseConnection().all(
    `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
  )
  const counts: Record<AccountRole, number> = { normal: 0, seller: 0, administrator: 0 }
  for (const value of rows) {
    const row = asRecord(value)
    const role = row.role
    const count = row.count
    const normalizedCount = typeof count === 'bigint' ? Number(count) : count
    if (
      (role === 'normal' || role === 'seller' || role === 'administrator') &&
      typeof normalizedCount === 'number' &&
      Number.isSafeInteger(normalizedCount)
    ) {
      counts[role] = normalizedCount
    }
  }
  return counts
}
