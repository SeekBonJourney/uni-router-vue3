/*
 * @Description:
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-06-22 08:14:05
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-06-22 19:12:45
 */
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
  const route = getHistory(history, history.length - 1)
  return route
}
