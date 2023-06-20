import { Router, Route } from './types'

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
  return history[history.length - 1]
}
