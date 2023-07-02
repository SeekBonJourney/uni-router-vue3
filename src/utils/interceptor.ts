/*
 * @Description: 添加跳转拦截器
 * @Version: 2.0
 * @Author: ljh_mp
 * @Date: 2023-06-16 16:40:31
 * @LastEditors: ljh_mp
 * @LastEditTime: 2023-06-22 19:31:43
 */
import { NavTypeEnum } from '../enum'
import {
  delay,
  mergeQueryAndUrlQuery,
  getHistory,
  pathHasExist,
  getFullPath
} from '.'
import {
  AfterEachGuard,
  BeforeEachGuard,
  NextRouteLocation,
  Route
} from '../types'

/**
 * next参数或者守卫的返回值 规则验证
 * @param {any} rule 返回值
 * @returns { Boolean | String | Object } 通过、未通过|重定向
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
  const tabHistory = uni.$mpRouter.tabHistory
  const guardHooks = uni.$mpRouter.router.guardHooks
  const from = getHistory(history, history.length - 1)
  let to: Route
  const { from: _, success, fail, ...otherOptions } = e
  if (type === NavTypeEnum.back) {
    const currentHistory = getHistory(
      history,
      history.length > e.delay ? history.length - e.delay - 1 : 0
    )
    to = Object.assign(currentHistory, otherOptions)
  } else {
    to = {
      ...otherOptions,
      path: e.url
    }
  }
  if (!to.query) to.query = {}
  if (!to.params) to.params = {}
  to.method = type
  to.from = from?.url
  return { router, history, tabHistory, guardHooks, to, from }
}

/**
 * 添加路由拦截器
 */
export function addRouterInterceptor() {
  const types = Object.values(NavTypeEnum)
  const keys = Object.keys(NavTypeEnum)
  types.forEach((type, index) => {
    uni.addInterceptor(type, {
      async invoke(e: any) {
        let isPass = true
        let isNext = false

        e.type = keys[index]
        const { router, history, tabHistory, guardHooks, to, from } =
          getCurrentRouteInfo(type, e)

        // 检查要跳转的网址是否存在
        if (type !== NavTypeEnum.back) {
          const fullPath =
            to.url.indexOf('/') === 0 && to.url !== '/'
              ? to.url
              : getFullPath(from.url, to.url)
          const hasExist = pathHasExist(fullPath)
          if (!hasExist) {
            return
          }
          to.url = fullPath
        }

        const next = (rule?: NextRouteLocation) => {
          if (isNext) {
            return
          }
          isNext = true
          const result = ruleVerify(rule)
          // 路由通过，继续跳转
          if (result === true) {
            router.go({
              ...to,
              type: e.type,
              ignoreGuard: true
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
        if (hooks.length && !to.ignoreGuard) {
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
              const rule = await hook(to, from, () => {})
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

        if (!isPass && !to.ignoreGuard) {
          return { data: {} }
        }

        // 延迟跳转
        if (e.delay > 0) {
          await delay(e.delay)
        }

        // 将url参数与query参数合并
        if (type !== NavTypeEnum.back) {
          mergeQueryAndUrlQuery(to)
          e.url = to.url
        }

        // TODO: 由于APP端success回调会在新页面加载之后执行，所以将添加历史记录及调用后置守卫放到了此处，以保证新页面使用setup语法获取到的路由为最新的，后期如果uniapp修复，可以放到success里执行（H5端可以放到success下，没有问题）
        // 跳转成功，添加历史记录
        if (type === NavTypeEnum.back) {
          const delta = e.delta || 1
          const start = history.length - delta
          history.splice(start > 0 ? start : 1, delta)
        } else {
          if (type === NavTypeEnum.push) {
            history.push(to)
          } else if (type === NavTypeEnum.replace) {
            history.splice(history.length - 2, 1, to)
          } else if (type === NavTypeEnum.tab) {
            // 由于tabbar页面在历史清除时并不会清除页面，所以此处做缓存处理以实现数据复用及响应式
            const key = to.url.split('?')[0]
            if (tabHistory[key]) {
              Object.assign(tabHistory[key], to)
            } else {
              tabHistory[key] = to
            }
            history.splice(0, history.length, tabHistory[key])
          } else if (type === NavTypeEnum.reLaunch) {
            history.splice(0, history.length, to)
          }
        }

        // 调用后置守卫
        const afterHooks = guardHooks.afterHooks as AfterEachGuard[]
        if (afterHooks.length) {
          for (let i = 0; i < afterHooks.length; i++) {
            const hook = afterHooks[i]
            hook(to, from)
          }
        }

        return e
      }
    })
  })
}
