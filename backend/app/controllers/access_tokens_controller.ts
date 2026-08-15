import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { serializeUser } from '#transformers/user_transformer'
import { findUserByEmail } from '#repositories/users_repository'
import hash from '@adonisjs/core/services/hash'

export default class AccessTokensController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await findUserByEmail(email.trim().toLowerCase())

    if (!user || !(await hash.verify(user.password, password))) {
      return response.unauthorized({ message: 'The email address or password is incorrect.' })
    }
    if (user.accountStatus !== 'active') {
      return response.forbidden({
        error: { code: 'ACCOUNT_UNAVAILABLE', message: 'This account is not available.' },
      })
    }
    if (!user.emailVerifiedAt) {
      return response.forbidden({
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email before signing in.' },
      })
    }

    await auth.use('web').login(user)
    return { data: serializeUser(user) }
  }

  async destroy({ auth }: HttpContext) {
    await auth.use('web').logout()
    return { message: 'Logged out successfully' }
  }
}
