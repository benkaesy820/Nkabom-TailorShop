import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdministratorMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    if (user.role !== 'administrator' || user.accountStatus !== 'active') {
      return response.forbidden({
        error: { code: 'ADMINISTRATOR_REQUIRED', message: 'Administrator access is required.' },
      })
    }
    return next()
  }
}
