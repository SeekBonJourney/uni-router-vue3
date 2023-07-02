/*
 * @Description:
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-05-24 16:14:15
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-06-22 19:44:43
 */
import { App, reactive } from 'vue'
import { Router, RouterOptions, BeforeEachGuard, AfterEachGuard } from './types'
import { jumpPromise, transformPageJson } from './utils'
import { addRouterInterceptor } from './utils/interceptor'

export function createRouter(options: RouterOptions) {
  const { nameAndPathEnum, allFullPath } = transformPageJson(options.pageJson)
  const router: Router = {
    pageJson: options.pageJson,
    nameAndPathEnum,
    allFullPath,
    guardHooks: {
      beforeHooks: [],
      afterHooks: []
    },
    push(options) {
      return jumpPromise(options, 'push')
    },
    tab(options) {
      return jumpPromise(options, 'tab')
    },
    replace(options) {
      return jumpPromise(options, 'replace')
    },
    reLaunch(options) {
      return jumpPromise(options, 'reLaunch')
    },
    back(options = 1) {
      return jumpPromise(options, 'back')
    },
    go(options) {
      return jumpPromise(options)
    },
    beforeEach(userGuard: BeforeEachGuard) {
      if (typeof userGuard === 'function') {
        router.guardHooks.beforeHooks.push(userGuard)
      }
    },
    afterEach(userGuard: AfterEachGuard) {
      if (typeof userGuard === 'function') {
        router.guardHooks.afterHooks.push(userGuard)
      }
    },
    install(app: App) {
      uni.$mpRouter = {
        router,
        history: reactive([]),
        tabHistory: {}
      }

      // 提供非setup组件使用方式
      Object.defineProperty(app.config.globalProperties, '$Router', {
        get: () => router
      })
      Object.defineProperty(app.config.globalProperties, '$Route', {
        enumerable: true,
        get: () => {
          const history = uni.$mpRouter.history
          return history[history.length - 1]
        }
      })

      // 添加路由拦截器
      addRouterInterceptor()
    }
  }
  return router
}
