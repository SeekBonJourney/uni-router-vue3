import { Router, Route } from './types'
import { reactive, Ref } from 'vue'
import { routerKey, routeKey } from './constant'

export function useRouter(): Router {
  const globalData = getApp().globalData as AnyObject
  const router = globalData[routerKey] as Router
  return router
}

/**
 *
 */
export function useRoute(): Route {
  const globalData = getApp().globalData as AnyObject
  const currentRoute = globalData[routeKey] as Ref<Route>
  return reactive(currentRoute.value)
}
