import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  SESSION_DRIVER: Env.schema.enum(['cookie'] as const),
  TURSO_DATABASE_URL: Env.schema.string(),
  TURSO_AUTH_TOKEN: Env.schema.string(),
  TURSO_DATABASE_HOST_GUARD: Env.schema.string({ format: 'host' }),
  TURSO_CONNECTION_POOL_SIZE: Env.schema.number(),
  FRONTEND_URL: Env.schema.string({ format: 'url', tld: false }),
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: 'email' }),
})
