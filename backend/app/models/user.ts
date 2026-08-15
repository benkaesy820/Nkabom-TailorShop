import { asRecord, nullableString, requiredInteger, requiredString } from '#database/row'

export const accountRoles = ['normal', 'seller', 'administrator'] as const
export type AccountRole = (typeof accountRoles)[number]

export const accountStatuses = ['active', 'suspended', 'disabled'] as const
export type AccountStatus = (typeof accountStatuses)[number]

function parseRole(value: string): AccountRole {
  switch (value) {
    case 'normal':
    case 'seller':
    case 'administrator':
      return value
    default:
      throw new Error(`Unknown account role: ${value}`)
  }
}

function parseStatus(value: string): AccountStatus {
  switch (value) {
    case 'active':
    case 'suspended':
    case 'disabled':
      return value
    default:
      throw new Error(`Unknown account status: ${value}`)
  }
}

export default class User {
  constructor(
    public readonly id: number,
    public readonly fullName: string | null,
    public readonly email: string,
    public readonly password: string,
    public readonly role: AccountRole,
    public readonly accountStatus: AccountStatus,
    public readonly emailVerifiedAt: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly version: number
  ) {}

  static fromRow(value: unknown): User {
    const row = asRecord(value)
    return new User(
      requiredInteger(row, 'id'),
      nullableString(row, 'full_name'),
      requiredString(row, 'email'),
      requiredString(row, 'password'),
      parseRole(requiredString(row, 'role')),
      parseStatus(requiredString(row, 'account_status')),
      nullableString(row, 'email_verified_at'),
      requiredString(row, 'created_at'),
      requiredString(row, 'updated_at'),
      requiredInteger(row, 'version')
    )
  }

  get initials(): string {
    const [first, last] = this.fullName ? this.fullName.trim().split(/\s+/) : this.email.split('@')
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    return (first || this.email).slice(0, 2).toUpperCase()
  }
}
