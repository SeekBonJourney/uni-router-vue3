import { Router, Route } from './types'
import { getHistory } from './utils'

/**
 * 获取路由管理器
 */
export function useRouter(): Router {
  return uni.$mpRouter.router
}

/**
 * 获取当前路由
 */
export function useRoute(): Route {
  const history = uni.$mpRouter.history
  return getHistory(history, history.length - 1)
}
