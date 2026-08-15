import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const NewAccountController = () => import('#controllers/new_account_controller')
const AccessTokensController = () => import('#controllers/access_tokens_controller')
const AccountRecoveryController = () => import('#controllers/account_recovery_controller')
const ProfileController = () => import('#controllers/profile_controller')
const SellerApplicationsController = () => import('#controllers/seller_applications_controller')
const AdminController = () => import('#controllers/admin_controller')
const RealtimeController = () => import('#controllers/realtime_controller')

router.get('/', () => ({ service: 'nkabom-api', status: 'ok' }))

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [NewAccountController, 'store'])
        router.post('login', [AccessTokensController, 'store'])
        router.post('verify-email/request', [AccountRecoveryController, 'requestVerification'])
        router.post('verify-email', [AccountRecoveryController, 'verifyEmail'])
        router.post('forgot-password', [AccountRecoveryController, 'forgotPassword'])
        router.post('reset-password', [AccountRecoveryController, 'resetPassword'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [ProfileController, 'show'])
        router.post('logout', [AccessTokensController, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth({ guards: ['web'] }))

    router
      .get('realtime/events', [RealtimeController, 'events'])
      .as('realtime.events')
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

    router
      .group(() => {
        router.get('/overview', [AdminController, 'overview'])
        router.get('/accounts', [AdminController, 'accounts'])
        router.patch('/accounts/:id', [AdminController, 'updateAccount'])
        router.get('/seller-applications', [AdminController, 'sellerApplications'])
        router.post('/seller-applications/:id/review', [AdminController, 'reviewSellerApplication'])
      })
      .prefix('admin')
      .as('admin')
      .use(middleware.auth({ guards: ['web'] }))
      .use(middleware.administrator())
  })
  .prefix('/api/v1')
