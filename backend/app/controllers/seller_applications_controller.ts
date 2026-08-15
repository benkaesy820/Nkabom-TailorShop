import { DomainError } from '#exceptions/domain_error'
import { findSellerApplicationByUserId } from '#repositories/seller_applications_repository'
import {
  saveSellerApplication,
  submitSellerApplication,
} from '#services/marketplace_mutations_service'
import { serializeSellerApplication } from '#transformers/seller_application_transformer'
import {
  sellerApplicationDraftValidator,
  sellerApplicationSubmitValidator,
} from '#validators/seller_application'
import type { HttpContext } from '@adonisjs/core/http'

function domainResponse(response: HttpContext['response'], error: DomainError) {
  return response.status(error.status).send({
    error: { code: error.code, message: error.message },
    message: error.message,
  })
}

function idempotencyKey(request: HttpContext['request']): string | null {
  const value = request.header('idempotency-key')?.trim()
  if (!value || value.length < 8 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) return null
  return value
}

function isVersion(value: number, allowZero = false): boolean {
  return Number.isSafeInteger(value) && (allowZero ? value >= 0 : value > 0)
}

export default class SellerApplicationsController {
  async show({ auth }: HttpContext) {
    const application = await findSellerApplicationByUserId(auth.getUserOrFail().id)
    return application ? { data: serializeSellerApplication(application) } : null
  }

  async save({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.accountStatus !== 'active') {
      return response.forbidden({ message: 'This account cannot apply for seller access.' })
    }
    if (!user.emailVerifiedAt) {
      return response.forbidden({ message: 'Verify your email before applying for seller access.' })
    }
    if (user.role !== 'normal') {
      return response.conflict({ message: 'Only normal accounts can apply for seller access.' })
    }

    const key = idempotencyKey(request)
    if (!key) return response.badRequest({ message: 'A valid Idempotency-Key header is required.' })
    const data = await request.validateUsing(sellerApplicationDraftValidator)
    if (!isVersion(data.expectedVersion, true)) {
      return response.badRequest({ message: 'expectedVersion must be a non-negative integer.' })
    }
    const { expectedVersion, ...draft } = data

    try {
      const result = await saveSellerApplication({
        userId: user.id,
        idempotencyKey: key,
        expectedVersion,
        draft,
      })
      return { data: result }
    } catch (error) {
      if (error instanceof DomainError) return domainResponse(response, error)
      throw error
    }
  }

  async submit({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.role !== 'normal' || user.accountStatus !== 'active' || !user.emailVerifiedAt) {
      return response.forbidden({ message: 'This account is not eligible to submit a seller application.' })
    }

    const key = idempotencyKey(request)
    if (!key) return response.badRequest({ message: 'A valid Idempotency-Key header is required.' })
    const input = await request.validateUsing(sellerApplicationSubmitValidator)
    if (!isVersion(input.expectedVersion)) {
      return response.badRequest({ message: 'expectedVersion must be a positive integer.' })
    }

    const application = await findSellerApplicationByUserId(user.id)
    if (!application) {
      return response.notFound({ message: 'Save an application draft before submitting.' })
    }
    if (application.version !== input.expectedVersion) {
      return response.conflict({
        message: 'The seller application changed after it was loaded. Refresh it before submitting.',
      })
    }
    if (application.status !== 'draft') {
      return response.conflict({ message: 'Only a draft application can be submitted.' })
    }

    const missing = [
      !application.primaryCategory && 'primaryCategory',
      application.specialities.length === 0 && 'specialities',
      !application.yearsOfExperience && 'yearsOfExperience',
      !application.professionalBio && 'professionalBio',
      application.languages.length === 0 && 'languages',
      !application.atelierName && 'atelierName',
      !application.businessType && 'businessType',
      !application.region && 'region',
      !application.city && 'city',
      !application.address && 'address',
      !application.phone && 'phone',
      !application.minLeadTimeDays && 'minLeadTimeDays',
      !application.maxLeadTimeDays && 'maxLeadTimeDays',
      !application.monthlyCapacity && 'monthlyCapacity',
    ].filter((field): field is string => Boolean(field))

    if (
      application.minLeadTimeDays &&
      application.maxLeadTimeDays &&
      application.minLeadTimeDays > application.maxLeadTimeDays
    ) {
      return response.unprocessableEntity({
        message: 'Maximum lead time must be greater than or equal to minimum lead time.',
      })
    }
    if (missing.length > 0) {
      return response.unprocessableEntity({
        message: 'Complete every required application field before submitting.',
        fields: missing,
      })
    }

    try {
      const result = await submitSellerApplication({
        userId: user.id,
        idempotencyKey: key,
        expectedVersion: input.expectedVersion,
      })
      return { data: result }
    } catch (error) {
      if (error instanceof DomainError) return domainResponse(response, error)
      throw error
    }
  }
}
