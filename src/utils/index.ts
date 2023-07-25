import { RouteLocationNameRaw, RouteLocationPathRaw } from './../types/index'
import {
  RouteLocation,
  NavType,
  PageJsonType,
  RouteLocationRaw,
  BackRouteLocationRaw,
  Route
} from '../types'
import { NavTypeEnum } from '../enum'
import { nextTick } from 'vue'

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
      arr.push(`${key}=${(query as AnyObject)[key]}`)
    })
    if (arr.length) {
      queryStr = arr.join('&')
    }
  }
  if (queryStr) {
    if (!url.includes('?')) {
      queryStr = '?' + queryStr
    } else {
      queryStr = '&' + queryStr
    }
  }
  return url + queryStr
}

/**
 * 获取url中的参数
 * @param url url
 * @returns 参数
 */
export function getUrlQuery(url: string = ''): AnyObject {
  const idx = url.indexOf('?')
  if (idx > -1) {
    const search = url.slice(idx + 1)
    const searchArray = search.split('&')
    return searchArray
      .map((item) => {
        const [key, rawValue = ''] = item.split('=')
        let value: any = decodeURIComponent(rawValue)
        if (/^\d*(\.?\d+)?$/.test(value)) {
          value = Number(value)
        } else if (value === 'true' || value === 'false') {
          value = value === 'true' ? true : false
        }
        return { [key]: value }
      })
      .reduce(
        (r, p) => ({
          ...r,
          ...p
        }),
        {}
      )
  }
  return {}
}

/**
 * 合并传递的query和url上的query
 * @param e
 */
export function mergeQueryAndUrlQuery(e: Route) {
  const path = e.url.split('?')[0]
  const urlQuery = getUrlQuery(e.url)
  e.query = { ...urlQuery, ...e.query }
  e.url = queryStringify(path, e.query)
}

/**
 * 获取指定历史记录，主要解决非首页进入，第一条历史不正确的问题
 * @param history 所有历史记录
 * @param index 要取的下标
 */
export function getHistory(history: Route[], index: number): Route {
  index = index < 0 ? 0 : index
  if (index === 0 && history.length === 0) {
    const pages = getCurrentPages()
    const firstPage = pages[0]
    const path = '/' + (firstPage.route || '')
    const url = (firstPage as any).$page?.fullPath || ''
    history[0] = {
      url: url,
      path: path,
      params: {},
      query: url ? getUrlQuery(url) : {},
      from: '',
      type: 'reLaunch',
      method: 'reLaunch'
    }
    if (!url) {
      nextTick(() => {
        history[0].url = (firstPage as any).$page?.fullPath || ''
        history[0].query = getUrlQuery(history[0].url)
      })
    }
    // 如果首页是tabbar页面，则保存在tabbar历史里
    const tabbar = uni.$mpRouter.router.pageJson.tabBar?.list
    if (tabbar && tabbar.length) {
      const tab = tabbar.find((tab) => tab.pagePath === firstPage.route)
      if (tab) {
        uni.$mpRouter.tabHistory[path] = history[0]
      }
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
 * 转换page.json配置
 * @param {PageJsonType} pageJson page配置，一般为page.json
 * @returns {AnyObject}
 */
export function transformPageJson(pageJson: PageJsonType): {
  nameAndPathEnum: AnyObject
  allFullPath: string[]
} {
  const nameAndPathEnum: AnyObject = {}
  const allFullPath: string[] = []
  if (pageJson.pages) {
    pageJson.pages.forEach((page) => {
      const fullPath = `/${page.path}`
      allFullPath.push(fullPath)
      if (page.name) {
        nameAndPathEnum[page.name] = fullPath
      }
    })
  }
  if (pageJson.subPackages) {
    pageJson.subPackages.forEach((subPage) => {
      const root = subPage.root
      if (subPage.pages) {
        subPage.pages.forEach((page) => {
          const fullPath = `/${root}/${page.path}`
          allFullPath.push(fullPath)
          if (page.name) {
            nameAndPathEnum[page.name] = fullPath
          }
        })
      }
    })
  }
  return { nameAndPathEnum, allFullPath }
}

/**
 * 获取要跳转的完整路径
 * @param fromPath 当前页面（全路径）
 * @param toPath 要跳转的页面
 * @returns {String} 完整的要跳转的路径
 */
export function getFullPath(fromPath: string, toPath: string) {
  if (toPath === '/') {
    return uni.$mpRouter.router.allFullPath[0]
  }
  const from = fromPath.split('/')
  const to = toPath.split('/')
  let end = 1
  for (let i = 0; i < to.length; i++) {
    const item = to[i]
    if (!item.includes('.')) break
    else {
      to.splice(i--, 1)
      if (item === '.') continue
      if (item === '..') end++
    }
  }
  return from
    .slice(0, -1 * end)
    .concat(to)
    .join('/')
}

/**
 * 判断跳转的网址是否存在
 * @param {String} path 地址
 * @returns {Boolean}
 */
export function pathHasExist(path: string) {
  return uni.$mpRouter.router.allFullPath.includes(path.split('?')[0])
}

/**
 * 深度合并对象
 * @param target
 * @param source
 */
export function deepObjectMerge(target: AnyObject, source: AnyObject) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const element = source[key]
      if (typeof element === 'object') {
        target[key] = deepObjectMerge(target[key] || {}, element)
      } else {
        target[key] = element
      }
    }
  }
  return target
}
