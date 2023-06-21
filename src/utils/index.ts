import { RouteLocationPathRaw } from './../../dist/types/index.d'
import { RouteLocationNameRaw } from './../types/index'
import {
  RouteLocation,
  NavType,
  PageJsonType,
  RouteLocationRaw,
  BackRouteLocationRaw,
  Route
} from '../types'
import { NavTypeEnum } from '../enum'

/**
 * 页面跳转Promise方法
 * @param {NavType} type 跳转类型
 * @param {Route} options 跳转配置
 * @returns {Promise}
 */
export function jumpPromise(options: RouteLocation, type?: NavType) {
  return new Promise((resolve, reject) => {
    type = (type ? type : (options as any)?.type || 'push') as NavType
    const opt: any = formatOptions(options, type)
    if (opt.path) {
      opt.url = opt.path
      delete opt.path
    }
    const methodName = NavTypeEnum[type]
    ;(uni[methodName] as any)({
      ...opt,
      success(res: any) {
        resolve(res)
      },
      fail(err: any) {
        reject(err)
      }
    })
  })
}

/**
 * 延迟执行
 * @param time 延迟时间
 * @returns {Promise}
 */
export function delay(time = 1) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(time)
    }, time)
  })
}

/**
 * 将query对象或字符串转成以?开头的query字符串
 * @param {string} url 网址
 * @param {AnyObject | string} query query对象或字符串
 * @returns {string} 完整的url
 */
export function queryStringify(
  url: string,
  query?: AnyObject | string
): string {
  let queryStr = ''
  if (
    !['string', 'object'].includes(typeof query) ||
    query === null ||
    Array.isArray(query)
  ) {
    queryStr = ''
  } else if (typeof query === 'string') {
    queryStr = query
  } else {
    let arr: AnyObject = []
    Object.keys(query as AnyObject).forEach((key) => {
      arr.push(`${key}=${encodeURIComponent((query as AnyObject)[key])}`)
    })
    if (arr.length) {
      queryStr = arr.join('&')
    }
  }
  if (!url.includes('?')) {
    queryStr = '?' + queryStr
  } else {
    queryStr = '&' + queryStr
  }
  return url + queryStr
}

/**
 * 获取url中的参数
 * @param url url
 * @returns 参数
 */
export function getUrlQuery(url: string): AnyObject {
  const regexp = /[\?|\&]([^\=|\#|\?|\&]+)=([^\=|\#|\?|\&]*)/g
  return Array.from(url.matchAll(regexp), (m) => ({
    [m[1]]: m[2]
  })).reduce(
    (r, p) => ({
      ...r,
      ...p
    }),
    {}
  )
}

/**
 * 合并传递的query和url上的query
 * @param e
 */
export function mergeQueryAndUrlQuery(e: { url: string; query?: AnyObject }) {
  e.url = queryStringify(e.url, e.query)
  e.query = getUrlQuery(e.url)
}

/**
 * 获取指定历史记录，主要解决非首页进入，第一条历史不正确的问题
 * @param history 所有历史记录
 * @param index 要取的下标
 */
export function getHistory(history: Route[], index: number): Route {
  if (
    index === 0 &&
    history[0].path === '/' &&
    Object.keys(history[0]).length === 1
  ) {
    const pages = getCurrentPages()
    const firstPage = pages[0]
    const path = firstPage.route || '/'
    history[0] = {
      path: path,
      params: {},
      query: getUrlQuery(path),
      from: '',
      type: undefined
    }
  }
  return history[index]
}

/**
 * 格式化配置为NextRouteLocationRaw
 * @param {RouteLocation} options 跳转配置
 * @param {NavType} type 跳转类型
 * @returns {NextRouteLocationRaw}
 */
export function formatOptions(
  options: RouteLocation,
  type: NavType
): RouteLocationRaw {
  if (type === 'back') {
    if (typeof options === 'number') {
      if (options < 60) {
        options = { delta: options }
      } else {
        options = { delay: options }
      }
    }
    return options as BackRouteLocationRaw
  } else {
    if (typeof options === 'string') {
      if (options.includes('/')) {
        options = { path: options }
      } else {
        const path = uni.$mpRouter.router.nameAndPathEnum[options]
        options = { path }
      }
    } else if (typeof options === 'object') {
      const name = (options as RouteLocationNameRaw).name
      if (name) {
        ;(options as RouteLocationPathRaw).path =
          uni.$mpRouter.router.nameAndPathEnum[name]
      }
    }
    return options as RouteLocationRaw
  }
}

/**
 * 将page.json配置转换为name与path的枚举配置
 * @param {PageJsonType} pageJson page配置，一般为page.json
 * @returns {AnyObject}
 */
export function transformPageJsonToEnum(pageJson: PageJsonType): AnyObject {
  const nameAndPathEnum: AnyObject = {}
  if (pageJson.pages) {
    pageJson.pages.forEach((page) => {
      if (page.name) {
        nameAndPathEnum[page.name] = `/${page.path}`
      }
    })
  }
  if (pageJson.subPackages) {
    pageJson.subPackages.forEach((subPage) => {
      const root = subPage.root
      if (subPage.pages) {
        subPage.pages.forEach((page) => {
          if (page.name) {
            nameAndPathEnum[page.name] = `/${root}/${page.path}`
          }
        })
      }
    })
  }
  return nameAndPathEnum
}
