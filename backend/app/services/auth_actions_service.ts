import env from '#start/env'
import { databaseConnection, retryTursoConflict } from '#database/client'
import { updatePassword } from '#repositories/users_repository'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import { createHash, randomBytes } from 'node:crypto'

export type AuthActionPurpose = 'verify_email' | 'reset_password'

const ttlMinutes: Record<AuthActionPurpose, number> = {
  verify_email: 60 * 24,
  reset_password: 30,
}

function digest(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function publicUrl(path: string, token: string) {
  const url = new URL(path, env.get('FRONTEND_URL'))
  url.searchParams.set('token', token)
  return url.toString()
}

export async function issueAuthAction(
  user: { id: number; email: string; fullName: string | null },
  purpose: AuthActionPurpose
) {
  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const createdAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + ttlMinutes[purpose] * 60_000).toISOString()

  await retryTursoConflict(() =>
    databaseConnection().batch(
      [
        {
          sql: `UPDATE auth_action_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL`,
          args: [createdAt, user.id, purpose],
        },
        {
          sql: `INSERT INTO auth_action_tokens (user_id, purpose, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)`,
          args: [user.id, purpose, digest(token), expiresAt, createdAt],
        },
      ],
      'concurrent'
    )
  )

  const verify = purpose === 'verify_email'
  const actionUrl = publicUrl(verify ? '/#verify-email' : '/#reset-password', token)
  await mail.send((message) => {
    message
      .to(user.email)
      .subject(verify ? 'Verify your Nkabom email' : 'Reset your Nkabom password')
      .text(
        `${verify ? 'Verify your email' : 'Reset your password'}: ${actionUrl}\n\nThis link expires in ${ttlMinutes[purpose]} minutes and can be used once.`
      )
      .html(
        `<p>Hello ${user.fullName ?? 'there'},</p><p><a href="${actionUrl}">${verify ? 'Verify your email' : 'Reset your password'}</a></p><p>This link expires in ${ttlMinutes[purpose]} minutes and can be used once.</p>`
      )
  })
}

export async function consumeAuthAction(token: string, purpose: AuthActionPurpose) {
  const usedAt = new Date().toISOString()
  const row: unknown = await databaseConnection().get(
    `UPDATE auth_action_tokens
     SET used_at = ?
     WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?
     RETURNING user_id`,
    [usedAt, digest(token), purpose, usedAt]
  )

  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const value = Reflect.get(row, 'user_id')
  const userId = typeof value === 'bigint' ? Number(value) : value
  if (typeof userId !== 'number' || !Number.isSafeInteger(userId)) {
    throw new Error('Database returned an invalid auth action user id')
  }
  return { userId }
}

export async function setPassword(userId: number, password: string) {
  await updatePassword(userId, await hash.make(password))
}
