import User from '#models/user'
import { consumeAuthAction, issueAuthAction, setPassword } from '#services/auth_actions_service'
import { emailOnlyValidator, resetPasswordValidator, tokenValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class AccountRecoveryController {
  async requestVerification({ request }: HttpContext) {
    const { email } = await request.validateUsing(emailOnlyValidator)
    const user = await User.findBy('email', email.trim().toLowerCase())
    if (user && !user.emailVerifiedAt) await issueAuthAction(user, 'verify_email')
    return { message: 'If that account needs verification, an email has been sent.' }
  }

  async verifyEmail({ request, response }: HttpContext) {
    const { token } = await request.validateUsing(tokenValidator)
    const action = await consumeAuthAction(token, 'verify_email')
    if (!action)
      return response.badRequest({ message: 'This verification link is invalid or expired.' })
    await User.query().where('id', action.userId).update({ emailVerifiedAt: DateTime.utc() })
    return { message: 'Email verified successfully.' }
  }

  async forgotPassword({ request }: HttpContext) {
    const { email } = await request.validateUsing(emailOnlyValidator)
    const user = await User.findBy('email', email.trim().toLowerCase())
    if (user) await issueAuthAction(user, 'reset_password')
    return { message: 'If that account exists, a password reset email has been sent.' }
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    const action = await consumeAuthAction(token, 'reset_password')
    if (!action)
      return response.badRequest({ message: 'This password reset link is invalid or expired.' })
    await setPassword(action.userId, password)
    return { message: 'Password reset successfully.' }
  }
}
