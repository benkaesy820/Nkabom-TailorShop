import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokensController {
  async store({ request, serialize, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email.trim().toLowerCase(), password)
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

    return serialize(UserTransformer.transform(user))
  }

  async destroy({ auth }: HttpContext) {
    await auth.use('web').logout()

    return {
      message: 'Logged out successfully',
    }
  }
}
