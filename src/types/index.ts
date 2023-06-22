import { App } from 'vue'
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
  delay?: number
  ignoreGuard?: boolean
}

// 路由进入动画配置
export type RouteEntryLocationAnimateRaw = {
  animationType?: EntryAnimationType
  animationDuration?: number
}

// 路由离开动画配置
export type RouteLeaveLocationAnimateRaw = {
  animationType?: LeaveAnimationType
  animationDuration?: number
}

// 基础跳转参数类型
export type BaseRouteLocationRaw = (
  | RouteLocationPathRaw
  | RouteLocationNameRaw
) &
  RouteLocationDataRaw

export type PushRouteLocationRaw = BaseRouteLocationRaw &
  RouteEntryLocationAnimateRaw & { events?: any }
export type BackRouteLocationRaw = RouteLocationDataRaw &
  RouteLeaveLocationAnimateRaw & { delta?: number }
export type OtherRouteLocationRaw = BaseRouteLocationRaw

export type PushRouteLocation = PushRouteLocationRaw | string
export type BackRouteLocation = BackRouteLocationRaw | number
export type OtherRouteLocation = OtherRouteLocationRaw | string

// 所有跳转参数类型
export type RouteLocationRaw =
  | PushRouteLocationRaw
  | BackRouteLocationRaw
  | OtherRouteLocationRaw
export type RouteLocation =
  | PushRouteLocation
  | BackRouteLocation
  | OtherRouteLocation

export type GoRouteLocation =
  | ({ type: 'push' } & PushRouteLocationRaw)
  | ({ type: 'back' } & BackRouteLocationRaw)
  | ({
      type: keyof Omit<typeof NavTypeEnum, 'back' | 'push'>
    } & OtherRouteLocation)
  | PushRouteLocationRaw
  | string

export type NextRouteLocation = GoRouteLocation | boolean

export type RouteRaw = {
  path: string
  url: string
  name?: string
}

export type Route = RouteRaw & {
  query: AnyObject
  params: AnyObject
  type: NavType
  ignoreGuard?: boolean
  delay?: number
  method: NavMethodType
  from?: string
  [propName: string]: any
}

// Router类型
export interface Router {
  pageJson: PageJsonType
  readonly nameAndPathEnum: AnyObject
  readonly allFullPath: string[]
  readonly guardHooks: GuardHooksConfig
  push(to: PushRouteLocation): void
  back(to?: BackRouteLocation): void
  replace(to: OtherRouteLocation): void
  reLaunch(to: OtherRouteLocation): void
  pushTab(to: OtherRouteLocation): void
  go(to: GoRouteLocation): void
  beforeEach(userGuard: BeforeEachGuard): void
  afterEach(userGuard: AfterEachGuard): void
  install(app: App): void
}

// 守卫函数
export type BeforeEachGuard = (
  to: Route,
  from: Route,
  next: (rule?: NextRouteLocation) => void
) => NextRouteLocation | void | Promise<NextRouteLocation | void>
export type AfterEachGuard = (to: Route, from: Route) => void
export interface GuardHooksConfig {
  beforeHooks: BeforeEachGuard[] // 前置钩子
  afterHooks: AfterEachGuard[] // 后置钩子
}

// 创建路由传递的参数
export interface RouterOptions {
  pageJson: PageJsonType
}

// page.json类型
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
