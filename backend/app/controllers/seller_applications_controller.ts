import SellerApplication from '#models/seller_application'
import SellerApplicationTransformer from '#transformers/seller_application_transformer'
import { sellerApplicationDraftValidator } from '#validators/seller_application'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class SellerApplicationsController {
  async show({ auth, serialize }: HttpContext) {
    const application = await SellerApplication.findBy('userId', auth.getUserOrFail().id)
    return application ? serialize(SellerApplicationTransformer.transform(application)) : null
  }

  async save({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.accountStatus !== 'active')
      return response.forbidden({ message: 'This account cannot apply for seller access.' })
    if (!user.emailVerifiedAt)
      return response.forbidden({ message: 'Verify your email before applying for seller access.' })
    if (user.accountType === 'seller')
      return response.conflict({ message: 'This account already has seller access.' })

    const data = await request.validateUsing(sellerApplicationDraftValidator)
    const existingApplication = await SellerApplication.findBy('userId', user.id)
    if (existingApplication && existingApplication.status !== 'draft')
      return response.conflict({ message: 'A submitted application cannot be edited.' })

    const application = existingApplication ?? new SellerApplication()
    application.merge({ userId: user.id, ...data })
    await application.save()
    return serialize(SellerApplicationTransformer.transform(application))
  }

  async submit({ auth, response, serialize }: HttpContext) {
    const application = await SellerApplication.findBy('userId', auth.getUserOrFail().id)
    if (!application)
      return response.notFound({ message: 'Save an application draft before submitting.' })
    if (application.status !== 'draft')
      return response.conflict({ message: 'This application has already been submitted.' })

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
    if (missing.length > 0)
      return response.unprocessableEntity({
        message: 'Complete every required application field before submitting.',
        fields: missing,
      })

    application.status = 'submitted'
    application.submittedAt = DateTime.now()
    await application.save()
    return serialize(SellerApplicationTransformer.transform(application))
  }
}
