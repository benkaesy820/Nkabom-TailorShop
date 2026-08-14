import type SellerApplication from '#models/seller_application'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SellerApplicationTransformer extends BaseTransformer<SellerApplication> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'primaryCategory',
      'specialities',
      'yearsOfExperience',
      'professionalBio',
      'languages',
      'atelierName',
      'businessType',
      'registrationNumber',
      'region',
      'city',
      'address',
      'serviceAreas',
      'phone',
      'whatsapp',
      'acceptsCommissions',
      'offersAlterations',
      'offersReadyMade',
      'offersInPersonFittings',
      'acceptsRemoteOrders',
      'minLeadTimeDays',
      'maxLeadTimeDays',
      'monthlyCapacity',
      'additionalServices',
      'status',
      'submittedAt',
      'createdAt',
      'updatedAt',
    ])
  }
}
