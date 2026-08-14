import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { issueAuthAction } from '#services/auth_actions_service'

export default class NewAccountController {
  async store({ request, serialize, response }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({
      fullName,
      email: email.trim().toLowerCase(),
      password,
      accountType: 'buyer',
      accountStatus: 'active',
    })
    await issueAuthAction(user, 'verify_email')

    response.status(201)
    return serialize(UserTransformer.transform(user))
  }
}
