import {
  RouteLocation,
  NavType,
  PageJsonType,
  RouteLocationRaw,
  BackRouteLocationRaw
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
export function getUrlParams(url: string): AnyObject {
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

export function mergeQueryAndUrlParams(e: { url: string; query?: AnyObject }) {
  e.url = queryStringify(e.url, e.query)
  e.query = getUrlParams(e.url)
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
