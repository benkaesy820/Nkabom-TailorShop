import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'accountType',
        'accountStatus',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      emailVerifiedAt: this.resource.emailVerifiedAt,
      isAdministrator: this.resource.isAdministrator,
    }
  }
}
