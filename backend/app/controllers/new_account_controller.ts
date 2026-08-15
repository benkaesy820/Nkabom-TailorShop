import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { serializeUser } from '#transformers/user_transformer'
import { issueAuthAction } from '#services/auth_actions_service'
import { createUser, findUserByEmail } from '#repositories/users_repository'
import hash from '@adonisjs/core/services/hash'

function isUniqueEmailError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed: users\.email/i.test(error.message)
}

export default class NewAccountController {
  async store({ request, response }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)
    const normalizedEmail = email.trim().toLowerCase()

    if (await findUserByEmail(normalizedEmail)) {
      return response.conflict({ message: 'An account with this email already exists.' })
    }

    try {
      const user = await createUser({
        fullName,
        email: normalizedEmail,
        passwordHash: await hash.make(password),
      })
      await issueAuthAction(user, 'verify_email')
      response.status(201)
      return { data: serializeUser(user) }
    } catch (error) {
      if (isUniqueEmailError(error)) {
        return response.conflict({ message: 'An account with this email already exists.' })
      }
      throw error
    }
  }
}
