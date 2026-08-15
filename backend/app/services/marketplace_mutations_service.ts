import type { AccountRole, AccountStatus } from '#models/user'
import type { SellerApplicationDraftInput } from '#repositories/seller_applications_repository'
import {
  reviewSellerApplicationInTransaction,
  saveSellerApplicationDraftInTransaction,
  submitSellerApplicationInTransaction,
} from '#repositories/seller_applications_repository'
import { updateUserAdministrationInTransaction } from '#repositories/users_repository'
import { runIdempotentMutation } from '#services/idempotency_service'
import {
  appendRealtimeEvent,
  appendRealtimeEventToActiveAdministrators,
} from '#services/realtime_service'
import { serializeSellerApplication } from '#transformers/seller_application_transformer'
import { serializeUser } from '#transformers/user_transformer'

export async function updateAccountAdministration(input: {
  administratorId: number
  idempotencyKey: string
  targetUserId: number
  expectedVersion: number
  role: AccountRole
  accountStatus: AccountStatus
}): Promise<unknown> {
  return runIdempotentMutation({
    actorUserId: input.administratorId,
    idempotencyKey: input.idempotencyKey,
    operation: `admin.account.update:${input.targetUserId}`,
    requestPayload: {
      expectedVersion: input.expectedVersion,
      role: input.role,
      accountStatus: input.accountStatus,
    },
    mutate: async ({ tx, events }) => {
      const user = await updateUserAdministrationInTransaction(tx, {
        userId: input.targetUserId,
        expectedVersion: input.expectedVersion,
        role: input.role,
        accountStatus: input.accountStatus,
      })
      events.push(
        await appendRealtimeEvent(tx, user.id, {
          type: 'account.updated',
          entityType: 'account',
          entityId: user.id,
          version: user.version,
        })
      )
      events.push(
        ...(await appendRealtimeEventToActiveAdministrators(tx, {
          type: 'admin.accounts.changed',
          entityType: 'admin_accounts',
          entityId: user.id,
          version: user.version,
        }))
      )
      return serializeUser(user)
    },
  })
}

export async function saveSellerApplication(input: {
  userId: number
  idempotencyKey: string
  expectedVersion: number
  draft: SellerApplicationDraftInput
}): Promise<unknown> {
  return runIdempotentMutation({
    actorUserId: input.userId,
    idempotencyKey: input.idempotencyKey,
    operation: 'seller-application.save',
    requestPayload: { expectedVersion: input.expectedVersion, draft: input.draft },
    mutate: async ({ tx, events }) => {
      const application = await saveSellerApplicationDraftInTransaction(
        tx,
        input.userId,
        input.expectedVersion,
        input.draft
      )
      events.push(
        await appendRealtimeEvent(tx, input.userId, {
          type: 'seller_application.updated',
          entityType: 'seller_application',
          entityId: application.id,
          version: application.version,
        })
      )
      return serializeSellerApplication(application)
    },
  })
}

export async function submitSellerApplication(input: {
  userId: number
  idempotencyKey: string
  expectedVersion: number
}): Promise<unknown> {
  return runIdempotentMutation({
    actorUserId: input.userId,
    idempotencyKey: input.idempotencyKey,
    operation: 'seller-application.submit',
    requestPayload: { expectedVersion: input.expectedVersion },
    mutate: async ({ tx, events }) => {
      const application = await submitSellerApplicationInTransaction(
        tx,
        input.userId,
        input.expectedVersion
      )
      events.push(
        await appendRealtimeEvent(tx, input.userId, {
          type: 'seller_application.updated',
          entityType: 'seller_application',
          entityId: application.id,
          version: application.version,
        })
      )
      events.push(
        ...(await appendRealtimeEventToActiveAdministrators(tx, {
          type: 'admin.seller_applications.changed',
          entityType: 'admin_seller_applications',
          entityId: application.id,
          version: application.version,
        }))
      )
      return serializeSellerApplication(application)
    },
  })
}

export async function reviewSellerApplication(input: {
  administratorId: number
  idempotencyKey: string
  applicationId: number
  expectedVersion: number
  decision: 'approved' | 'rejected'
  reviewNotes: string | null
}): Promise<unknown> {
  return runIdempotentMutation({
    actorUserId: input.administratorId,
    idempotencyKey: input.idempotencyKey,
    operation: `admin.seller-application.review:${input.applicationId}`,
    requestPayload: {
      expectedVersion: input.expectedVersion,
      decision: input.decision,
      reviewNotes: input.reviewNotes,
    },
    mutate: async ({ tx, events }) => {
      const result = await reviewSellerApplicationInTransaction(tx, {
        applicationId: input.applicationId,
        expectedVersion: input.expectedVersion,
        administratorId: input.administratorId,
        decision: input.decision,
        reviewNotes: input.reviewNotes,
      })
      events.push(
        await appendRealtimeEvent(tx, result.application.userId, {
          type: 'seller_application.updated',
          entityType: 'seller_application',
          entityId: result.application.id,
          version: result.application.version,
        })
      )
      events.push(
        ...(await appendRealtimeEventToActiveAdministrators(tx, {
          type: 'admin.seller_applications.changed',
          entityType: 'admin_seller_applications',
          entityId: result.application.id,
          version: result.application.version,
        }))
      )
      if (result.promotedUser) {
        events.push(
          await appendRealtimeEvent(tx, result.promotedUser.id, {
            type: 'account.updated',
            entityType: 'account',
            entityId: result.promotedUser.id,
            version: result.promotedUser.version,
          })
        )
        events.push(
          ...(await appendRealtimeEventToActiveAdministrators(tx, {
            type: 'admin.accounts.changed',
            entityType: 'admin_accounts',
            entityId: result.promotedUser.id,
            version: result.promotedUser.version,
          }))
        )
      }
      return serializeSellerApplication(result.application)
    },
  })
}
