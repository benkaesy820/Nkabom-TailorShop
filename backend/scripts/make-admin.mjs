import { connect } from '@tursodatabase/serverless'

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: npm run account:make-admin -- person@example.com')
  process.exit(1)
}

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
const expectedHost = process.env.TURSO_DATABASE_HOST_GUARD
if (!url || !authToken || !expectedHost) throw new Error('Turso environment variables are required')
const parsed = new URL(url)
if (parsed.protocol !== 'turso:' || parsed.hostname !== expectedHost) {
  throw new Error('Refusing administrator update because the Turso host guard does not match')
}

const db = connect({ url, authToken })
try {
  const now = new Date().toISOString()
  const statement = await db.prepare(
    `UPDATE users SET role = 'administrator', account_status = 'active', updated_at = ?, version = version + 1 WHERE email = ? COLLATE NOCASE`
  )
  const result = await statement.run([now, email])
  if (result.changes !== 1) throw new Error(`No account found for ${email}`)
  console.log(`Administrator role granted to ${email}`)
} finally {
  await db.close()
}
