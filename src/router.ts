/*
 * @Description:
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-05-24 16:14:15
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-05-26 09:49:48
 */
import { App, shallowRef, unref } from 'vue'
import {
  Router,
  RouterOptions,
  BeforeEachGuard,
  AfterEachGuard,
  Route
} from './types'
import { useCallbacks, formatOptions, baseRouterGo, routerBack } from './utils'
import { routeKey, routerKey } from './constant'

export function createRouter(options: RouterOptions) {
  const beforeGuards = useCallbacks<BeforeEachGuard>()
  const afterGuards = useCallbacks<AfterEachGuard>()
  const currentRoute = shallowRef<Route>({
    path: '/',
    fullPath: '/',
    params: {},
    query: {}
  })

  const router: Router = {
    routes: options.routes,
    route: currentRoute,
    guardHooks: {
      beforeHooks: beforeGuards.list,
      afterHooks: afterGuards.list
    },
    push(options) {
      return baseRouterGo(router, formatOptions(options, 'push'))
    },
    pushTab(options) {
      return baseRouterGo(router, formatOptions(options, 'pushTab'))
    },
    replace(options) {
      return baseRouterGo(router, formatOptions(options, 'replace'))
    },
    reLaunch(options) {
      return baseRouterGo(router, formatOptions(options, 'reLaunch'))
    },
    back(options = 1) {
      return baseRouterGo(router, formatOptions(options, 'back'))
    },
    go(options) {
      return baseRouterGo(router, options)
    },
    beforeEach(userGuard: BeforeEachGuard) {
      beforeGuards.add(userGuard)
    },
    afterEach(userGuard: AfterEachGuard) {
      afterGuards.add(userGuard)
    },
    install(app: App) {
      console.log(app)
      Object.defineProperty(app.config.globalProperties, '$Router', {
        get: () => router
      })
      Object.defineProperty(app.config.globalProperties, '$Route', {
        enumerable: true,
        get: () => unref(currentRoute)
      })
      app.mixin({
        onLaunch() {
          const globalData = getApp().globalData as AnyObject
          globalData[routerKey] = router
          globalData[routeKey] = currentRoute
        },
        onBackPress() {
          routerBack({}, router)
        }
      })
    }
  }
  return router
}
