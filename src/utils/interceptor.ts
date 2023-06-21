/*
 * @Description: 添加跳转拦截器
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-06-16 16:40:31
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-06-21 09:17:48
 */
import { delay, mergeQueryAndUrlQuery, getHistory } from '.'
import { NavTypeEnum } from '../enum'
import {
  AfterEachGuard,
  BeforeEachGuard,
  NextRouteLocation,
  Route
} from '../types'

/**
 * next或者守卫的返回值 规则验证
 * @param {any} rule 返回值
 * @returns { Boolean | String | String } 通过|未通过|重定向
 */
function ruleVerify(rule: any) {
  if (rule === null || rule === false) {
    return false
  } else if (
    typeof rule === 'string' ||
    (!Array.isArray(rule) && rule instanceof Object)
  ) {
    return rule
  }
  return true
}

/**
 * 获取当前路由信息
 * @param type 跳转类型
 * @param e 跳转参数
 * @returns { router, history, to, from }
 */
function getCurrentRouteInfo(type: NavTypeEnum, e: any) {
  const router = uni.$mpRouter.router
  const history = uni.$mpRouter.history
  const guardHooks = uni.$mpRouter.router.guardHooks
  const from = getHistory(history, history.length - 1)
  const to: Route =
    type === NavTypeEnum.back
      ? getHistory(
          history,
          history.length > e.delay ? history.length - e.delay - 1 : 0
        )
      : {
          ...e,
          type,
          path: e.url
        }
  to.from = from?.path
  return { router, history, guardHooks, to, from }
}

/**
 * 添加路由拦截器
 */
export function addRouterInterceptor() {
  const types = Object.values(NavTypeEnum)
  types.forEach((type) => {
    uni.addInterceptor(type, {
      async invoke(e: any) {
        let isPass = true

        const { router, guardHooks, to, from } = getCurrentRouteInfo(type, e)

        const next = (rule?: NextRouteLocation) => {
          const result = ruleVerify(rule)
          // 路由通过，继续跳转
          if (result === true) {
            router.go({
              ...e,
              type
            })
          }
          // 重定向跳转
          else if (result) {
            router.go(result)
          }
        }

        // 获取前置守卫前置守卫
        const hooks = guardHooks.beforeHooks as BeforeEachGuard[]

        // 未配置前置守卫，直接通过
        if (hooks.length) {
          // 循环执行前置守卫
          for (let i = 0; i < hooks.length; i++) {
            // 获取当前守卫
            const hook = hooks[i]
            // 获取守卫传递的参数量
            const argsLen = hook.length
            // 根据函数的参数长度，判断是否使用了next函数
            if (argsLen > 2) {
              // 如果使用next, 则必须调用next, 否则将持续等待调用，不会跳转
              isPass = false
              await hook(to, from, next)
              break
            } else {
              // 没有使用next,则使用返回值作为守卫结果进行跳转
              const rule = await hook(to, from)
              const result = ruleVerify(rule)
              if (result === false || result !== true) {
                isPass = false
                if (result) {
                  router.go(result)
                }
                break
              }
            }
          }
        }

        if (!isPass) {
          return false
        }

        // 延迟跳转
        if (e.delay > 0) {
          await delay(e.delay)
        }

        // 将url参数与query参数合并
        mergeQueryAndUrlQuery(e)

        return e
      },

      success() {
        const e = arguments[1]
        const { history, guardHooks, to, from } = getCurrentRouteInfo(type, e)

        // 调用后置守卫
        const hooks = guardHooks.afterHooks as AfterEachGuard[]
        if (hooks.length) {
          for (let i = 0; i < hooks.length; i++) {
            const hook = hooks[i]
            hook(to, from)
          }
        }

        // 跳转成功，添加历史记录
        if (type === NavTypeEnum.back) {
          const delay = e.delay || 1
          history.splice(history.length - delay, delay)
        } else {
          if (type === NavTypeEnum.push) {
            history.push(to)
          } else if (type === NavTypeEnum.replace) {
            history.splice(history.length - 2, 1, to)
          } else if (
            type === NavTypeEnum.pushTab ||
            type === NavTypeEnum.reLaunch
          ) {
            history.splice(0, history.length, to)
          }
        }
      }
    })
  })
}
