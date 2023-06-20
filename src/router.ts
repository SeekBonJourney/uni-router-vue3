/*
 * @Description:
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-05-24 16:14:15
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-06-20 18:22:13
 */
import { App } from 'vue'
import { Router, RouterOptions, BeforeEachGuard, AfterEachGuard } from './types'
import { jumpPromise } from './utils'
import { addRouterInterceptor } from './utils/interceptor'

export function createRouter(options: RouterOptions) {
  const router: Router = {
    nameAndPathEnum: options.nameAndPathEnum,
    push(options) {
      return jumpPromise(options, 'push')
    },
    pushTab(options) {
      return jumpPromise(options, 'pushTab')
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
        uni.$mpRouter.guardHooks.beforeHooks.push(userGuard)
      }
    },
    afterEach(userGuard: AfterEachGuard) {
      if (typeof userGuard === 'function') {
        uni.$mpRouter.guardHooks.afterHooks.push(userGuard)
      }
    },
    install(app: App) {
      uni.$mpRouter = {
        router,
        history: [],
        guardHooks: {
          beforeHooks: [],
          afterHooks: []
        }
      }

      // TODO: 刷新页面时，初始化history,防止页面使用useRoute获取不到当前页面
      app.mixin({
        beforeCreate() {
          const pages = getCurrentPages()
          const page = pages[pages.length - 1]
          console.log(page)
        }
      })

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
