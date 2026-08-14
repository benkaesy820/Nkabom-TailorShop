import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

export const emailOnlyValidator = vine.create({ email: email() })
export const tokenValidator = vine.create({ token: vine.string().minLength(32).maxLength(128) })
export const resetPasswordValidator = vine.create({
  token: vine.string().minLength(32).maxLength(128),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})
