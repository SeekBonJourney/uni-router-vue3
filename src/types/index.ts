import { Ref, App } from 'vue'
import { NavTypeEnum } from '../enum'

export type NavType = keyof typeof NavTypeEnum
export type NavMethodType = `${NavTypeEnum}`

export type EntryAnimationType =
  | 'slide-in-right'
  | 'slide-in-left'
  | 'slide-in-top'
  | 'slide-in-bottom'
  | 'pop-in'
  | 'fade-in'
  | 'zoom-out'
  | 'zoom-fade-out'
  | 'none'

export type LeaveAnimationType =
  | 'slide-out-right'
  | 'slide-out-left'
  | 'slide-out-top'
  | 'slide-out-bottom'
  | 'pop-out'
  | 'fade-out'
  | 'zoom-in'
  | 'zoom-fade-in'
  | 'none'

export type AllAnimationType = EntryAnimationType & LeaveAnimationType

// 通过path路由跳转
export type RouteLocationPathRaw = {
  path: string
}

// 通过name路由跳转
export type RouteLocationNameRaw = {
  name: string
}

// 路由跳转其他配置
export type RouteLocationDataRaw = {
  params?: AnyObject
  query?: AnyObject
}

// 路由跳转动画配置
export type RouteLocationAnimateRaw = {
  animationType?: AllAnimationType
  animationDuration?: number
}

// 基础跳转参数类型
export type RouteBaseLocationRaw = (
  | RouteLocationPathRaw
  | RouteLocationNameRaw
) &
  RouteLocationDataRaw
export type RouteBaseLocation = RouteBaseLocationRaw | string

export type RoutePushLocationRaw = RouteBaseLocationRaw &
  RouteLocationAnimateRaw
export type RoutePushLocation = RoutePushLocationRaw | string

export type RouteBackLocationRaw = {
  delta?: number
  params?: AnyObject
} & RouteLocationAnimateRaw
export type RouteBackLocation = RouteBackLocationRaw | number

export type RouteLocation =
  | RouteBaseLocation
  | RoutePushLocation
  | RouteBackLocation

export type NextRouteLocationRaw =
  | ({ navType: 'back' } & RouteBackLocationRaw)
  | ({ navType: 'push' } & RoutePushLocationRaw)
  | ({
      navType: keyof Omit<typeof NavTypeEnum, 'back' | 'push'>
    } & RouteBaseLocationRaw)

// let a: NextRouteLocationRaw = {
//   navType: 'push',
//   name: 'asd'
// }

export type RouteRaw = {
  path: string
  name?: string
}

export type Route = RouteRaw & {
  fullPath: string
  query?: AnyObject
  params?: AnyObject
  type?: NavType
  from?: Route
}

type PageType = {
  path: string
  name?: string
  [propName: string]: any
}

type SubPageType = {
  root: string
  pages?: PageType[]
}

export type PageJsonType = {
  pages?: PageType[]
  subPackages?: SubPageType[]
}

/**
 * Router instance.
 */
export interface Router {
  route: Ref<Route> // 当前路由信息
  routes: Route[] // 路由表
  readonly guardHooks: GuardHooksConfig // 守卫钩子
  push(to: RoutePushLocation): void
  replace(to: RouteBaseLocation): void
  reLaunch(to: RouteBaseLocation): void
  pushTab(to: RouteBaseLocation): void
  back(to?: RouteBackLocation): void
  go(to: NextRouteLocationRaw): void
  beforeEach(userGuard: BeforeEachGuard): void // 全局前置路由守卫
  afterEach(userGuard: AfterEachGuard): void // 全局后置路由守卫
  install(App: App): void
}

export type BeforeEachGuard = (
  to: Route | undefined,
  from: Route,
  next?: (rule?: NextRouteLocationRaw | boolean) => void
) => NextRouteLocationRaw | boolean | undefined // 全局前置守卫函数
export type AfterEachGuard = (to: Route, from: Route) => void // 全局后置守卫函数

export interface GuardHooksConfig {
  beforeHooks: BeforeEachGuard[] // 前置钩子
  afterHooks: AfterEachGuard[] // 后置钩子
}

export interface RouterOptions {
  routes: Route[]
}
