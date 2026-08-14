import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

export default defineConfig({
  default: 'smtp',
  from: { address: env.get('MAIL_FROM_ADDRESS'), name: 'Nkabom' },
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: false,
      ignoreTLS: true,
    }),
  },
})
