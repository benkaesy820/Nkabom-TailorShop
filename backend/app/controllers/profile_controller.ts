import { serializeUser } from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth }: HttpContext) {
    return { data: serializeUser(auth.getUserOrFail()) }
  }
}
