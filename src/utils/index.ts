import {
  RouteLocation,
  NextRouteLocationRaw,
  Route,
  Router,
  NavType,
  RouteBackLocationRaw,
  RoutePushLocationRaw,
  RouteLocationNameRaw,
  RouteLocationPathRaw,
  NavMethodType,
  PageJsonType
} from '../types'
import { NavTypeEnum } from '../enum'
import { routeKey, routerKey } from '../constant'

/**
 * 基础路由跳转函数 （前置守卫拦截）
 * @param {Router} router 路由
 * @param {NextRouteLocationRaw} options 跳转配置
 * @returns {Promise}
 */
export function baseRouterGo(router: Router, options: NextRouteLocationRaw) {
  const from = getCurrentPageRoute(router)
  const to = getRouteByOptions(router, options, from)
  if (!to) {
    return Promise.reject('跳转的页面不存在')
  }

  // 调用前置守卫
  const hooks = router.guardHooks.beforeHooks
  if (!hooks.length) {
    return basePageSwitch(options, to, from, router)
  }

  return new Promise(async (resolve, reject) => {
    let isNext = false
    let isUseNext = false
    const handleGuardNext = (rule?: NextRouteLocationRaw | boolean) => {
      if (isNext) {
        return
      }

      if (rule === false) {
        isNext = true
        reject('跳转失败，路由守卫拦截！')
        return
      }
      if (rule === undefined || rule === true) {
        // 如果使用了next,则跳转
        if (isUseNext) {
          basePageSwitch(options, to, from, router)
            .then((res) => {
              resolve(res)
            })
            .catch((err) => {
              reject(err)
            })
        }
        // 否则进入下一个守卫，或在守卫结束时跳转
        return
      }
      isNext = true
      baseRouterGo(router, formatOptions(rule, rule.navType || 'push'))
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    }

    // 循环执行前置守卫
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i]
      const argsLen = hook.length
      // 根据函数的参数长度，判断是否使用了next函数
      if (argsLen > 2) {
        // 如果使用next, 则必须调用next, 否则将持续等待调用，不会跳转
        isUseNext = true
        hook(to, from, handleGuardNext)
        break
      } else {
        // 没有使用next,则使用返回值作为守卫结果进行跳转
        handleGuardNext(await hook(to, from))
        if (isNext) {
          break
        }
      }
    }
    // 在没有使用next函数时，所有守卫运行完成还没有跳转，则默认守卫通过，直接跳转
    if (!isUseNext && !isNext) {
      isNext = true
      basePageSwitch(options, to, from, router)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    }
  })
}

/**
 * 基础页面跳转函数（已通过前置守卫，在跳转完成后，执行后置守卫）
 * @param {NextRouteLocationRaw} options 跳转配置
 * @param {Route} to 要跳转的Route
 * @param {Route} from 当前页面的route
 * @param {Router} router 路由
 * @returns {Promise}
 */
export function basePageSwitch(
  options: NextRouteLocationRaw,
  to: Route,
  from: Route,
  router: Router
) {
  return new Promise((resolve, reject) => {
    // 保存当前route
    saveCurrentRoute(options, to, from)

    const resultCallback = {
      success: (res: any) => {
        // 调用后置守卫
        const afterHooks = router.guardHooks.afterHooks
        if (afterHooks.length) {
          afterHooks.forEach((guard) => {
            guard(to, from)
          })
        }
        resolve(res)
      },
      fail: (err: any) => {
        reject(err)
      }
    }
    const switchMethod = NavTypeEnum[options.navType] as NavMethodType
    if (options.navType === 'back' || switchMethod === 'navigateBack') {
      const opt = options as RouteBackLocationRaw
      uni.navigateBack({
        delta: opt.delta,
        animationType: opt.animationType || 'pop-out',
        animationDuration: opt.animationDuration || 300,
        ...resultCallback
      })
    } else {
      const url = to.fullPath + queryStringify(options.query)
      if (switchMethod === 'navigateTo') {
        const opt = options as RoutePushLocationRaw
        uni.navigateTo({
          url,
          animationType: opt.animationType || 'pop-in',
          animationDuration: opt.animationDuration || 300,
          ...resultCallback
        })
      } else {
        uni[switchMethod]({
          url,
          ...resultCallback
        })
      }
    }
  })
}

/**
 * 将query对象或字符串转成以?开头的query字符串
 * @param {AnyObject | string} query query对象或字符串
 * @returns {string}
 */
export function queryStringify(query?: AnyObject | string): string {
  if (
    !['string', 'object'].includes(typeof query) ||
    query === null ||
    Array.isArray(query)
  ) {
    return ''
  }
  if (typeof query === 'string') {
    return '?' + query
  }
  let arr: AnyObject = []
  Object.keys(query as AnyObject).forEach((key) => {
    arr.push(`${key}=${encodeURIComponent((query as AnyObject)[key])}`)
  })
  if (arr.length) {
    return '?' + arr.join('&')
  }
  return ''
}

/**
 * 保存当前页面的Route，用于useRoute获取当前页面路由
 * @param {NextRouteLocationRaw} options 跳转配置
 * @param to 要跳转的页面
 * @param from 当前页面
 */
export function saveCurrentRoute(
  options: NextRouteLocationRaw,
  to: Route,
  from: Route
) {
  const globalData = getApp().globalData as AnyObject
  const { from: _, ...useFrom } = from
  const currRoute = {
    ...to,
    type: options.navType,
    from: useFrom,
    params: options.params || {}
  }
  if (options.navType !== 'back') {
    currRoute.query = options.query || {}
  }
  const route = JSON.parse(JSON.stringify(currRoute))
  globalData[routeKey].value = route
}

/**
 * 页面返回保存Route，用于监听设备硬件返回设置Route
 * nue页面已在全局混入，nvue页面需要在onBackPress回调中手动调用
 * @param {AnyObject} params 传递的参数
 * @param {Router} router 全局路由
 */
export function routerBack(params?: AnyObject, router?: Router) {
  if (!router) {
    const globalData = getApp().globalData as AnyObject
    router = globalData[routerKey] as Router
  }
  const options: NextRouteLocationRaw = {
    delta: 1,
    navType: 'back',
    params: params || {}
  }
  const from = getCurrentPageRoute(router)
  const to = getBackPageRoute(router, options)
  saveCurrentRoute(options, to, from)
}

/**
 * 将page.json配置转换为routes配置
 * @param {PageJsonType} pageJson page配置，一般为page.json
 * @returns {Route[]}
 */
export function transformPageJsonToRoutes(pageJson: PageJsonType): Route[] {
  const routes: Route[] = []
  if (pageJson.pages) {
    pageJson.pages.forEach((page) => {
      routes.push({
        path: page.path,
        name: page.name,
        fullPath: `/${page.path}`
      })
    })
  }
  if (pageJson.subPackages) {
    pageJson.subPackages.forEach((subPage) => {
      const root = subPage.root
      if (subPage.pages) {
        subPage.pages.forEach((page) => {
          routes.push({
            path: page.path,
            name: page.name,
            fullPath: `/${root}/${page.path}`
          })
        })
      }
    })
  }
  return routes
}

/**
 * 根据跳转配置获取name和path
 * @param {NextRouteLocationRaw} options 跳转配置
 * @returns {Required<RouteLocationNameRaw & RouteLocationPathRaw>}
 */
export function getPathAndNameByOptions(
  options: NextRouteLocationRaw
): Required<RouteLocationNameRaw & RouteLocationPathRaw> {
  return {
    name: (options as RouteLocationNameRaw).name,
    path: (options as RouteLocationPathRaw).path
  }
}

/**
 * 获取当前页面
 * @returns {Page.PageInstance<AnyObject, {}> | undefined}
 */
export function getCurrentPage() {
  const pages = getCurrentPages()
  return pages.length > 0 ? pages[pages.length - 1] : undefined
}

/**
 * 获取当前页面Route
 * @param {Router} router 全局路由
 * @returns {Route}
 */
export function getCurrentPageRoute(router: Router): Route {
  const page = getCurrentPage() as AnyObject
  let currRoute = getRouteByPath(router, `/${page.route}`) as Route
  if (currRoute.fullPath === router.route.value.fullPath) {
    currRoute = router.route.value
  }
  return currRoute
}

/**
 * 获取返回的页面的Route
 * @param {Router} router 全局路由
 * @param {NextRouteLocationRaw} options 跳转配置
 * @returns
 */
export function getBackPageRoute(
  router: Router,
  options: NextRouteLocationRaw
): Route {
  const pages = getCurrentPages()
  const pagesLen = pages.length
  let delta = (options as RouteBackLocationRaw).delta || 1
  let index = pagesLen - delta - 1
  if (index < 0) {
    index = 0
  }
  const page = pages[index]
  const route = getRouteByPath(router, `/${page.route}`) as Route
  return route
}

/**
 * 根据跳转配置获取Route
 * @param {Router} router 全局路由
 * @param {NextRouteLocationRaw} options 跳转配置
 * @returns
 */
export function getRouteByOptions(
  router: Router,
  options: NextRouteLocationRaw,
  from: Route
): Route | undefined {
  let route: Route | undefined = undefined
  if (options.navType === 'back') {
    route = getBackPageRoute(router, options)
  } else {
    const opt = getPathAndNameByOptions(options)
    if (opt.name) {
      route = getRouteByName(router, opt.name)
    }
    if (opt.path) {
      route = getRouteByPath(router, opt.path)
    }
  }
  if (route) {
    const { from: _, ...useFrom } = from
    route = {
      ...route,
      params: options.params,
      type: options.navType,
      from: useFrom
    }
    if (options.navType !== 'back') {
      route.query = options.query
    }
  }
  return route
}

/**
 * 根据name获取path
 * @param {Router} router 全局路由
 * @param {string} name name
 * @returns {string}
 */
export function getPathByName(
  router: Router,
  name: string
): string | undefined {
  const route = getRouteByName(router, name)
  if (route) {
    return route.path
  }
  return undefined
}

/**
 * 根据path获取Route
 * @param {Router} router 全局路由
 * @param {string} path path
 * @returns {Route}
 */
export function getRouteByPath(
  router: Router,
  path: string
): Route | undefined {
  return router.routes.find(
    (route) => route.path === path || route.fullPath === path
  )
}

/**
 * 根据name获取Route
 * @param {Router} router 全局路由
 * @param {string} name name
 * @returns {Route}
 */
export function getRouteByName(
  router: Router,
  name: string
): Route | undefined {
  return router.routes.find((route) => route.name === name)
}

/**
 * 格式化配置为NextRouteLocationRaw
 * @param {RouteLocation} options 跳转配置
 * @param {NavType} navType 跳转类型
 * @returns {NextRouteLocationRaw}
 */
export function formatOptions(
  options: RouteLocation,
  navType: NavType
): NextRouteLocationRaw {
  if (navType === 'back') {
    if (typeof options === 'number') {
      options = { delta: options }
    }
    return { ...(options as RouteBackLocationRaw), navType: 'back' }
  } else {
    if (typeof options === 'string') {
      options = { path: options }
    }
    return {
      ...(options as AnyObject),
      navType
    } as NextRouteLocationRaw
  }
}

/**
 * 回调函数缓存组合式API
 * @returns
 */
export function useCallbacks<T>() {
  let handlers: T[] = []

  function add(handler: T): () => void {
    handlers.push(handler)
    return () => {
      const i = handlers.indexOf(handler)
      if (i > -1) handlers.splice(i, 1)
    }
  }

  function reset() {
    handlers = []
  }

  return {
    add,
    list: handlers,
    reset
  }
}
