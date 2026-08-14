/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

const AccountRecoveryController = () => import('#controllers/account_recovery_controller')
const SellerApplicationsController = () => import('#controllers/seller_applications_controller')

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
        router.post('verify-email/request', [AccountRecoveryController, 'requestVerification'])
        router.post('verify-email', [AccountRecoveryController, 'verifyEmail'])
        router.post('forgot-password', [AccountRecoveryController, 'forgotPassword'])
        router.post('reset-password', [AccountRecoveryController, 'resetPassword'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .group(() => {
        router.get('/', [SellerApplicationsController, 'show'])
        router.put('/', [SellerApplicationsController, 'save'])
        router.post('/submit', [SellerApplicationsController, 'submit'])
      })
      .prefix('seller-application')
      .as('sellerApplication')
      .use(middleware.auth({ guards: ['web'] }))
  })
  .prefix('/api/v1')
