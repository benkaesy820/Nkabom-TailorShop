import { databaseConnection, type DatabaseExecutor } from '#database/client'
import { asRecord } from '#database/row'
import { DomainError } from '#exceptions/domain_error'
import SellerApplication, { type SellerApplicationStatus } from '#models/seller_application'
import type User from '#models/user'
import { findUserById } from '#repositories/users_repository'

export const applicationColumns = `
  id, user_id, primary_category, specialities, years_of_experience, professional_bio,
  languages, atelier_name, business_type, registration_number, region, city, address,
  service_areas, phone, whatsapp, accepts_commissions, offers_alterations,
  offers_ready_made, offers_in_person_fittings, accepts_remote_orders,
  min_lead_time_days, max_lead_time_days, monthly_capacity, additional_services,
  status, submitted_at, reviewed_at, reviewed_by_admin_id, review_notes, created_at, updated_at, version
`

export type SellerApplicationDraftInput = {
  primaryCategory?: string | null
  specialities?: string[]
  yearsOfExperience?: string | null
  professionalBio?: string | null
  languages?: string[]
  atelierName?: string | null
  businessType?: 'individual' | 'sole_proprietor' | 'registered_company' | 'cooperative' | null
  registrationNumber?: string | null
  region?: string | null
  city?: string | null
  address?: string | null
  serviceAreas?: string | null
  phone?: string | null
  whatsapp?: string | null
  acceptsCommissions?: boolean
  offersAlterations?: boolean
  offersReadyMade?: boolean
  offersInPersonFittings?: boolean
  acceptsRemoteOrders?: boolean
  minLeadTimeDays?: number | null
  maxLeadTimeDays?: number | null
  monthlyCapacity?: number | null
  additionalServices?: string | null
}

function json(values: string[]): string {
  return JSON.stringify(values)
}

function bit(value: boolean): number {
  return value ? 1 : 0
}

export async function findSellerApplicationByUserId(
  userId: number,
  executor: DatabaseExecutor = databaseConnection()
): Promise<SellerApplication | null> {
  const row: unknown = await executor.get(
    `SELECT ${applicationColumns} FROM seller_applications WHERE user_id = ?`,
    [userId]
  )
  return row ? SellerApplication.fromRow(row) : null
}

export async function findSellerApplicationById(
  id: number,
  executor: DatabaseExecutor = databaseConnection()
): Promise<SellerApplication | null> {
  const row: unknown = await executor.get(
    `SELECT ${applicationColumns} FROM seller_applications WHERE id = ?`,
    [id]
  )
  return row ? SellerApplication.fromRow(row) : null
}

type ResolvedSellerApplicationDraft = {
  [Key in keyof SellerApplicationDraftInput]-?: Exclude<SellerApplicationDraftInput[Key], undefined>
}

function mergeDraft(
  existing: SellerApplication | null,
  input: SellerApplicationDraftInput
): ResolvedSellerApplicationDraft {
  return {
    primaryCategory:
      input.primaryCategory !== undefined
        ? input.primaryCategory
        : (existing?.primaryCategory ?? null),
    specialities:
      input.specialities !== undefined ? input.specialities : (existing?.specialities ?? []),
    yearsOfExperience:
      input.yearsOfExperience !== undefined
        ? input.yearsOfExperience
        : (existing?.yearsOfExperience ?? null),
    professionalBio:
      input.professionalBio !== undefined
        ? input.professionalBio
        : (existing?.professionalBio ?? null),
    languages: input.languages !== undefined ? input.languages : (existing?.languages ?? []),
    atelierName:
      input.atelierName !== undefined ? input.atelierName : (existing?.atelierName ?? null),
    businessType:
      input.businessType !== undefined ? input.businessType : (existing?.businessType ?? null),
    registrationNumber:
      input.registrationNumber !== undefined
        ? input.registrationNumber
        : (existing?.registrationNumber ?? null),
    region: input.region !== undefined ? input.region : (existing?.region ?? null),
    city: input.city !== undefined ? input.city : (existing?.city ?? null),
    address: input.address !== undefined ? input.address : (existing?.address ?? null),
    serviceAreas:
      input.serviceAreas !== undefined ? input.serviceAreas : (existing?.serviceAreas ?? null),
    phone: input.phone !== undefined ? input.phone : (existing?.phone ?? null),
    whatsapp: input.whatsapp !== undefined ? input.whatsapp : (existing?.whatsapp ?? null),
    acceptsCommissions:
      input.acceptsCommissions !== undefined
        ? input.acceptsCommissions
        : (existing?.acceptsCommissions ?? false),
    offersAlterations:
      input.offersAlterations !== undefined
        ? input.offersAlterations
        : (existing?.offersAlterations ?? false),
    offersReadyMade:
      input.offersReadyMade !== undefined
        ? input.offersReadyMade
        : (existing?.offersReadyMade ?? false),
    offersInPersonFittings:
      input.offersInPersonFittings !== undefined
        ? input.offersInPersonFittings
        : (existing?.offersInPersonFittings ?? false),
    acceptsRemoteOrders:
      input.acceptsRemoteOrders !== undefined
        ? input.acceptsRemoteOrders
        : (existing?.acceptsRemoteOrders ?? false),
    minLeadTimeDays:
      input.minLeadTimeDays !== undefined
        ? input.minLeadTimeDays
        : (existing?.minLeadTimeDays ?? null),
    maxLeadTimeDays:
      input.maxLeadTimeDays !== undefined
        ? input.maxLeadTimeDays
        : (existing?.maxLeadTimeDays ?? null),
    monthlyCapacity:
      input.monthlyCapacity !== undefined
        ? input.monthlyCapacity
        : (existing?.monthlyCapacity ?? null),
    additionalServices:
      input.additionalServices !== undefined
        ? input.additionalServices
        : (existing?.additionalServices ?? null),
  }
}

export async function saveSellerApplicationDraftInTransaction(
  executor: DatabaseExecutor,
  userId: number,
  expectedVersion: number,
  input: SellerApplicationDraftInput
): Promise<SellerApplication> {
  const existing = await findSellerApplicationByUserId(userId, executor)
  const draft = mergeDraft(existing, input)
  if (!existing) {
    if (expectedVersion !== 0) {
      throw new DomainError(
        409,
        'STALE_APPLICATION_VERSION',
        'The seller application changed after it was loaded. Refresh it before saving.'
      )
    }
    const now = new Date().toISOString()
    await executor.run(
      `INSERT INTO seller_applications (
        user_id, primary_category, specialities, years_of_experience, professional_bio,
        languages, atelier_name, business_type, registration_number, region, city, address,
        service_areas, phone, whatsapp, accepts_commissions, offers_alterations,
        offers_ready_made, offers_in_person_fittings, accepts_remote_orders,
        min_lead_time_days, max_lead_time_days, monthly_capacity, additional_services,
        status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?
      )`,
      [
        userId,
        draft.primaryCategory ?? null,
        json(draft.specialities),
        draft.yearsOfExperience ?? null,
        draft.professionalBio ?? null,
        json(draft.languages),
        draft.atelierName ?? null,
        draft.businessType ?? null,
        draft.registrationNumber ?? null,
        draft.region ?? null,
        draft.city ?? null,
        draft.address ?? null,
        draft.serviceAreas ?? null,
        draft.phone ?? null,
        draft.whatsapp ?? null,
        bit(draft.acceptsCommissions),
        bit(draft.offersAlterations),
        bit(draft.offersReadyMade),
        bit(draft.offersInPersonFittings),
        bit(draft.acceptsRemoteOrders),
        draft.minLeadTimeDays ?? null,
        draft.maxLeadTimeDays ?? null,
        draft.monthlyCapacity ?? null,
        draft.additionalServices ?? null,
        now,
        now,
      ]
    )
  } else {
    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      throw new DomainError(
        409,
        'APPLICATION_LOCKED',
        'A submitted or approved application cannot be edited.'
      )
    }
    if (existing.version !== expectedVersion) {
      throw new DomainError(
        409,
        'STALE_APPLICATION_VERSION',
        'The seller application changed after it was loaded. Refresh it before saving.'
      )
    }

    const now = new Date().toISOString()
    const result = await executor.run(
      `UPDATE seller_applications SET
        primary_category = ?, specialities = ?, years_of_experience = ?, professional_bio = ?,
        languages = ?, atelier_name = ?, business_type = ?, registration_number = ?, region = ?, city = ?,
        address = ?, service_areas = ?, phone = ?, whatsapp = ?, accepts_commissions = ?, offers_alterations = ?,
        offers_ready_made = ?, offers_in_person_fittings = ?, accepts_remote_orders = ?, min_lead_time_days = ?,
        max_lead_time_days = ?, monthly_capacity = ?, additional_services = ?, status = 'draft', submitted_at = NULL,
        updated_at = ?, version = version + 1
       WHERE user_id = ? AND version = ? AND status IN ('draft', 'rejected')`,
      [
        draft.primaryCategory ?? null,
        json(draft.specialities),
        draft.yearsOfExperience ?? null,
        draft.professionalBio ?? null,
        json(draft.languages),
        draft.atelierName ?? null,
        draft.businessType ?? null,
        draft.registrationNumber ?? null,
        draft.region ?? null,
        draft.city ?? null,
        draft.address ?? null,
        draft.serviceAreas ?? null,
        draft.phone ?? null,
        draft.whatsapp ?? null,
        bit(draft.acceptsCommissions),
        bit(draft.offersAlterations),
        bit(draft.offersReadyMade),
        bit(draft.offersInPersonFittings),
        bit(draft.acceptsRemoteOrders),
        draft.minLeadTimeDays ?? null,
        draft.maxLeadTimeDays ?? null,
        draft.monthlyCapacity ?? null,
        draft.additionalServices ?? null,
        now,
        userId,
        expectedVersion,
      ]
    )
    if (result.changes !== 1) {
      throw new DomainError(
        409,
        'STALE_APPLICATION_VERSION',
        'The seller application changed while it was being saved. Refresh it before trying again.'
      )
    }
  }

  const application = await findSellerApplicationByUserId(userId, executor)
  if (!application) throw new Error('Seller application was not available after saving')
  return application
}

export async function submitSellerApplicationInTransaction(
  executor: DatabaseExecutor,
  userId: number,
  expectedVersion: number
): Promise<SellerApplication> {
  const current = await findSellerApplicationByUserId(userId, executor)
  if (!current)
    throw new DomainError(
      404,
      'APPLICATION_MISSING',
      'Save an application draft before submitting.'
    )
  if (current.version !== expectedVersion) {
    throw new DomainError(
      409,
      'STALE_APPLICATION_VERSION',
      'The seller application changed after it was loaded. Refresh it before submitting.'
    )
  }
  if (current.status !== 'draft') {
    throw new DomainError(
      409,
      'APPLICATION_ALREADY_SUBMITTED',
      'Only a draft application can be submitted.'
    )
  }

  const now = new Date().toISOString()
  const result = await executor.run(
    `UPDATE seller_applications
     SET status = 'submitted', submitted_at = ?, reviewed_at = NULL, reviewed_by_admin_id = NULL,
         review_notes = NULL, updated_at = ?, version = version + 1
     WHERE user_id = ? AND status = 'draft' AND version = ?`,
    [now, now, userId, expectedVersion]
  )
  if (result.changes !== 1) {
    throw new DomainError(
      409,
      'STALE_APPLICATION_VERSION',
      'The seller application changed while it was being submitted. Refresh it before trying again.'
    )
  }
  const application = await findSellerApplicationByUserId(userId, executor)
  if (!application) throw new Error('Seller application disappeared after submission')
  return application
}

export async function listSellerApplications(
  status?: SellerApplicationStatus
): Promise<SellerApplication[]> {
  const rows: unknown[] = status
    ? await databaseConnection().all(
        `SELECT ${applicationColumns} FROM seller_applications WHERE status = ? ORDER BY updated_at DESC, id DESC LIMIT 200`,
        [status]
      )
    : await databaseConnection().all(
        `SELECT ${applicationColumns} FROM seller_applications ORDER BY updated_at DESC, id DESC LIMIT 200`
      )
  return rows.map(SellerApplication.fromRow)
}

export async function countSellerApplicationsByStatus(): Promise<
  Record<SellerApplicationStatus, number>
> {
  const rows: unknown[] = await databaseConnection().all(
    `SELECT status, COUNT(*) AS count FROM seller_applications GROUP BY status`
  )
  const counts: Record<SellerApplicationStatus, number> = {
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  }
  for (const value of rows) {
    const row = asRecord(value)
    const status = row.status
    const count = row.count
    const normalizedCount = typeof count === 'bigint' ? Number(count) : count
    if (
      (status === 'draft' ||
        status === 'submitted' ||
        status === 'approved' ||
        status === 'rejected') &&
      typeof normalizedCount === 'number' &&
      Number.isSafeInteger(normalizedCount)
    ) {
      counts[status] = normalizedCount
    }
  }
  return counts
}

export async function reviewSellerApplicationInTransaction(
  executor: DatabaseExecutor,
  input: {
    applicationId: number
    expectedVersion: number
    administratorId: number
    decision: 'approved' | 'rejected'
    reviewNotes: string | null
  }
): Promise<{ application: SellerApplication; promotedUser: User | null }> {
  const application = await findSellerApplicationById(input.applicationId, executor)
  if (!application)
    throw new DomainError(404, 'APPLICATION_NOT_FOUND', 'Seller application not found.')
  if (application.version !== input.expectedVersion) {
    throw new DomainError(
      409,
      'STALE_APPLICATION_VERSION',
      'This seller application changed after it was loaded. Refresh it before reviewing.'
    )
  }
  if (application.status !== 'submitted') {
    throw new DomainError(
      409,
      'APPLICATION_NOT_REVIEWABLE',
      'Only submitted applications can be reviewed.'
    )
  }

  const now = new Date().toISOString()
  let promotedUser: User | null = null
  if (input.decision === 'approved') {
    const roleResult = await executor.run(
      `UPDATE users
       SET role = 'seller', updated_at = ?, version = version + 1
       WHERE id = ? AND role = 'normal' AND account_status = 'active'`,
      [now, application.userId]
    )
    if (roleResult.changes !== 1) {
      throw new DomainError(
        409,
        'APPLICANT_ROLE_CHANGED',
        'The applicant is no longer eligible for seller approval.'
      )
    }
    promotedUser = await findUserById(application.userId, executor)
    if (!promotedUser) throw new Error('Applicant disappeared during seller approval')
  }

  const reviewResult = await executor.run(
    `UPDATE seller_applications
     SET status = ?, reviewed_at = ?, reviewed_by_admin_id = ?, review_notes = ?, updated_at = ?,
         version = version + 1
     WHERE id = ? AND status = 'submitted' AND version = ?`,
    [
      input.decision,
      now,
      input.administratorId,
      input.reviewNotes,
      now,
      input.applicationId,
      input.expectedVersion,
    ]
  )
  if (reviewResult.changes !== 1) {
    throw new DomainError(
      409,
      'APPLICATION_REVIEW_CONFLICT',
      'The application changed during review.'
    )
  }

  const updated = await findSellerApplicationById(input.applicationId, executor)
  if (!updated) throw new Error('Seller application disappeared during review')
  return { application: updated, promotedUser }
}
