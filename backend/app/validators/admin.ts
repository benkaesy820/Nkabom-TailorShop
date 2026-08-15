import vine from '@vinejs/vine'

export const adminAccountUpdateValidator = vine.create({
  expectedVersion: vine.number().min(1),
  role: vine.enum(['normal', 'seller', 'administrator']),
  accountStatus: vine.enum(['active', 'suspended', 'disabled']),
})

export const sellerApplicationReviewValidator = vine.create({
  expectedVersion: vine.number().min(1),
  decision: vine.enum(['approved', 'rejected']),
  reviewNotes: vine.string().trim().maxLength(2000).nullable().optional(),
})
