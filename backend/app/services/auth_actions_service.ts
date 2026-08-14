import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

type Purpose = 'verify_email' | 'reset_password'

const ttlMinutes: Record<Purpose, number> = {
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
  purpose: Purpose
) {
  const token = randomBytes(32).toString('base64url')
  await db
    .from('auth_action_tokens')
    .where({ user_id: user.id, purpose })
    .whereNull('used_at')
    .update({ used_at: DateTime.utc().toSQL() })
  await db.table('auth_action_tokens').insert({
    user_id: user.id,
    purpose,
    token_hash: digest(token),
    expires_at: DateTime.utc().plus({ minutes: ttlMinutes[purpose] }).toSQL(),
    created_at: DateTime.utc().toSQL(),
  })

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

export async function consumeAuthAction(token: string, purpose: Purpose) {
  return db.transaction(async (trx) => {
    const record = await trx
      .from('auth_action_tokens')
      .where({ token_hash: digest(token), purpose })
      .whereNull('used_at')
      .where('expires_at', '>', DateTime.utc().toSQL())
      .forUpdate()
      .first()
    if (!record) return null
    await trx
      .from('auth_action_tokens')
      .where('id', record.id)
      .update({ used_at: DateTime.utc().toSQL() })
    return { userId: Number(record.user_id), trx }
  })
}

export async function setPassword(userId: number, password: string) {
  const passwordHash = await hash.make(password)
  await db
    .from('users')
    .where('id', userId)
    .update({ password: passwordHash, updated_at: DateTime.utc().toSQL() })
}
