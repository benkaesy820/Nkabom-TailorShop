import { DomainError } from '#exceptions/domain_error'
import { sellerApplicationStatuses } from '#models/seller_application'
import { countUsersByRole, listUsers } from '#repositories/users_repository'
import {
  countSellerApplicationsByStatus,
  listSellerApplications,
} from '#repositories/seller_applications_repository'
import {
  reviewSellerApplication,
  updateAccountAdministration,
} from '#services/marketplace_mutations_service'
import { serializeSellerApplication } from '#transformers/seller_application_transformer'
import { serializeUser } from '#transformers/user_transformer'
import { adminAccountUpdateValidator, sellerApplicationReviewValidator } from '#validators/admin'
import type { HttpContext } from '@adonisjs/core/http'

function positiveId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function idempotencyKey(request: HttpContext['request']): string | null {
  const value = request.header('idempotency-key')?.trim()
  if (!value || value.length < 8 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) return null
  return value
}

function domainResponse(response: HttpContext['response'], error: DomainError) {
  return response.status(error.status).send({
    error: { code: error.code, message: error.message },
    message: error.message,
  })
}

function isPositiveVersion(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0
}

export default class AdminController {
  async overview() {
    const [roles, applications] = await Promise.all([
      countUsersByRole(),
      countSellerApplicationsByStatus(),
    ])
    return { data: { roles, applications } }
  }

  async accounts() {
    const users = await listUsers()
    return { data: users.map(serializeUser) }
  }

  async updateAccount({ auth, params, request, response }: HttpContext) {
    const targetId = positiveId(params.id)
    if (!targetId) return response.badRequest({ message: 'Invalid account id.' })
    const key = idempotencyKey(request)
    if (!key) return response.badRequest({ message: 'A valid Idempotency-Key header is required.' })

    const input = await request.validateUsing(adminAccountUpdateValidator)
    if (!isPositiveVersion(input.expectedVersion)) {
      return response.badRequest({ message: 'expectedVersion must be a positive integer.' })
    }

    const administrator = auth.getUserOrFail()
    if (
      targetId === administrator.id &&
      (input.role !== 'administrator' || input.accountStatus !== 'active')
    ) {
      return response.conflict({
        message: 'You cannot remove your own active administrator access from this session.',
      })
    }

    try {
      const data = await updateAccountAdministration({
        administratorId: administrator.id,
        idempotencyKey: key,
        targetUserId: targetId,
        expectedVersion: input.expectedVersion,
        role: input.role,
        accountStatus: input.accountStatus,
      })
      return { data }
    } catch (error) {
      if (error instanceof DomainError) return domainResponse(response, error)
      throw error
    }
  }

  async sellerApplications({ request, response }: HttpContext) {
    const requestedStatus = request.input('status')
    let status: (typeof sellerApplicationStatuses)[number] | undefined
    if (requestedStatus !== undefined && requestedStatus !== '') {
      if (typeof requestedStatus !== 'string') {
        return response.badRequest({ message: 'Invalid application status.' })
      }
      switch (requestedStatus) {
        case 'draft':
        case 'submitted':
        case 'approved':
        case 'rejected':
          status = requestedStatus
          break
        default:
          return response.badRequest({ message: 'Invalid application status.' })
      }
    }

    const applications = await listSellerApplications(status)
    return { data: applications.map(serializeSellerApplication) }
  }

  async reviewSellerApplication({ auth, params, request, response }: HttpContext) {
    const applicationId = positiveId(params.id)
    if (!applicationId) return response.badRequest({ message: 'Invalid seller application id.' })
    const key = idempotencyKey(request)
    if (!key) return response.badRequest({ message: 'A valid Idempotency-Key header is required.' })

    const input = await request.validateUsing(sellerApplicationReviewValidator)
    if (!isPositiveVersion(input.expectedVersion)) {
      return response.badRequest({ message: 'expectedVersion must be a positive integer.' })
    }
    if (input.decision === 'rejected' && !input.reviewNotes?.trim()) {
      return response.unprocessableEntity({
        message: 'A rejection reason is required so the applicant can correct the application.',
      })
    }

    try {
      const data = await reviewSellerApplication({
        applicationId,
        administratorId: auth.getUserOrFail().id,
        idempotencyKey: key,
        expectedVersion: input.expectedVersion,
        decision: input.decision,
        reviewNotes: input.reviewNotes ?? null,
      })
      return { data }
    } catch (error) {
      if (error instanceof DomainError) return domainResponse(response, error)
      throw error
    }
  }
}
