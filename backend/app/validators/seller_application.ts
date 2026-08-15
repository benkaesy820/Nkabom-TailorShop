import vine from '@vinejs/vine'

const optionalText = (maxLength: number) =>
  vine.string().trim().maxLength(maxLength).nullable().optional()

export const sellerApplicationDraftValidator = vine.create({
  expectedVersion: vine.number().min(0),
  primaryCategory: optionalText(80),
  specialities: vine.array(vine.string().trim().maxLength(80)).maxLength(20).optional(),
  yearsOfExperience: optionalText(40),
  professionalBio: optionalText(2000),
  languages: vine.array(vine.string().trim().maxLength(80)).maxLength(20).optional(),
  atelierName: optionalText(160),
  businessType: vine
    .enum(['individual', 'sole_proprietor', 'registered_company', 'cooperative'])
    .nullable()
    .optional(),
  registrationNumber: optionalText(80),
  region: optionalText(80),
  city: optionalText(120),
  address: optionalText(500),
  serviceAreas: optionalText(500),
  phone: optionalText(32),
  whatsapp: optionalText(32),
  acceptsCommissions: vine.boolean().optional(),
  offersAlterations: vine.boolean().optional(),
  offersReadyMade: vine.boolean().optional(),
  offersInPersonFittings: vine.boolean().optional(),
  acceptsRemoteOrders: vine.boolean().optional(),
  minLeadTimeDays: vine.number().min(1).max(365).nullable().optional(),
  maxLeadTimeDays: vine.number().min(1).max(365).nullable().optional(),
  monthlyCapacity: vine.number().min(1).max(10000).nullable().optional(),
  additionalServices: optionalText(2000),
})

export const sellerApplicationSubmitValidator = vine.create({
  expectedVersion: vine.number().min(1),
})
