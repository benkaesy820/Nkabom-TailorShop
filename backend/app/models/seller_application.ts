import {
  asRecord,
  nullableInteger,
  nullableString,
  requiredBoolean,
  requiredInteger,
  requiredString,
  stringArray,
} from '#database/row'

export const sellerApplicationStatuses = ['draft', 'submitted', 'approved', 'rejected'] as const
export type SellerApplicationStatus = (typeof sellerApplicationStatuses)[number]

export const sellerBusinessTypes = [
  'individual',
  'sole_proprietor',
  'registered_company',
  'cooperative',
] as const
export type SellerBusinessType = (typeof sellerBusinessTypes)[number]

function parseStatus(value: string): SellerApplicationStatus {
  switch (value) {
    case 'draft':
    case 'submitted':
    case 'approved':
    case 'rejected':
      return value
    default:
      throw new Error(`Unknown seller application status: ${value}`)
  }
}

function parseBusinessType(value: string | null): SellerBusinessType | null {
  if (value === null) return null
  switch (value) {
    case 'individual':
    case 'sole_proprietor':
    case 'registered_company':
    case 'cooperative':
      return value
    default:
      throw new Error(`Unknown seller business type: ${value}`)
  }
}

export default class SellerApplication {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly primaryCategory: string | null,
    public readonly specialities: string[],
    public readonly yearsOfExperience: string | null,
    public readonly professionalBio: string | null,
    public readonly languages: string[],
    public readonly atelierName: string | null,
    public readonly businessType: SellerBusinessType | null,
    public readonly registrationNumber: string | null,
    public readonly region: string | null,
    public readonly city: string | null,
    public readonly address: string | null,
    public readonly serviceAreas: string | null,
    public readonly phone: string | null,
    public readonly whatsapp: string | null,
    public readonly acceptsCommissions: boolean,
    public readonly offersAlterations: boolean,
    public readonly offersReadyMade: boolean,
    public readonly offersInPersonFittings: boolean,
    public readonly acceptsRemoteOrders: boolean,
    public readonly minLeadTimeDays: number | null,
    public readonly maxLeadTimeDays: number | null,
    public readonly monthlyCapacity: number | null,
    public readonly additionalServices: string | null,
    public readonly status: SellerApplicationStatus,
    public readonly submittedAt: string | null,
    public readonly reviewedAt: string | null,
    public readonly reviewedByAdminId: number | null,
    public readonly reviewNotes: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly version: number
  ) {}

  static fromRow(value: unknown): SellerApplication {
    const row = asRecord(value)
    return new SellerApplication(
      requiredInteger(row, 'id'),
      requiredInteger(row, 'user_id'),
      nullableString(row, 'primary_category'),
      stringArray(row, 'specialities'),
      nullableString(row, 'years_of_experience'),
      nullableString(row, 'professional_bio'),
      stringArray(row, 'languages'),
      nullableString(row, 'atelier_name'),
      parseBusinessType(nullableString(row, 'business_type')),
      nullableString(row, 'registration_number'),
      nullableString(row, 'region'),
      nullableString(row, 'city'),
      nullableString(row, 'address'),
      nullableString(row, 'service_areas'),
      nullableString(row, 'phone'),
      nullableString(row, 'whatsapp'),
      requiredBoolean(row, 'accepts_commissions'),
      requiredBoolean(row, 'offers_alterations'),
      requiredBoolean(row, 'offers_ready_made'),
      requiredBoolean(row, 'offers_in_person_fittings'),
      requiredBoolean(row, 'accepts_remote_orders'),
      nullableInteger(row, 'min_lead_time_days'),
      nullableInteger(row, 'max_lead_time_days'),
      nullableInteger(row, 'monthly_capacity'),
      nullableString(row, 'additional_services'),
      parseStatus(requiredString(row, 'status')),
      nullableString(row, 'submitted_at'),
      nullableString(row, 'reviewed_at'),
      nullableInteger(row, 'reviewed_by_admin_id'),
      nullableString(row, 'review_notes'),
      requiredString(row, 'created_at'),
      requiredString(row, 'updated_at'),
      requiredInteger(row, 'version')
    )
  }
}
