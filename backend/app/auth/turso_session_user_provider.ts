import { symbols } from '@adonisjs/auth'
import User from '#models/user'
import { findUserById } from '#repositories/users_repository'

export class TursoSessionUserProvider {
  declare [symbols.PROVIDER_REAL_USER]: User

  async createUserForGuard(user: User) {
    return {
      getId: () => user.id,
      getOriginal: () => user,
    }
  }

  async findById(identifier: string | number | bigint) {
    const id = typeof identifier === 'bigint' ? Number(identifier) : Number(identifier)
    if (!Number.isSafeInteger(id) || id <= 0) return null
    const user = await findUserById(id)
    if (!user || user.accountStatus !== 'active') return null
    return this.createUserForGuard(user)
  }
}
