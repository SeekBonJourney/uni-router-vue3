# 说明

为uniapp写的路由库，实现类似vue-router的效果，仅支持vue3（兼容nvue）

## 使用方法

---

### 配置及初始化

``` js
// router/index.js
import { createRouter } from '@ljhmp/uni-router-vue3'
import pageJson from '@/pages.json'

const router = createRouter({
  pageJson
})
export default router

```

``` js
// main.js
import { createSSRApp } from 'vue'
import router from './router'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  return {
    app
  }
}

```

### 路由跳转方法

### router.push

```js
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";

const router = useRouter()
const route = useRoute()

// 使用path进行跳转
router.push('/pages/home/home')

// 使用name进行跳转（需要再page.json的页面配置下配置name属性）
router.push('home')

// 使用配置参数
router.push({ 
  path: '', // 使用path跳转，配置name时将被无效
  name: '', // 使用name跳转，优先级高于path
  delay: 500,  // 延时跳转
  query: {},  // 附带到url上的参数，将与url上的参数合并，优先级高于url上的参数（适合传递简单数据，刷新页面仍能获取）
  params: {},  // 传递的参数，可传递复杂数据，函数等（适合传递复杂数据，刷新页面后无法获取）
  ignoreGuard: false,  // 是否忽略前置守卫
  // 其他一些原生navigateTo方法的参数
  animationType: '',
  animationDuration: 300,
  events: any
})
```

### router.pushTab、router.replace、router.reLaunch

```js
// 以上三个方法接收参数相同，与push相比缺少了动画及events配置
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";

const router = useRouter()
const route = useRoute()

// 使用path进行跳转
router.pushTab('/pages/home/home')

// 使用name进行跳转（需要再page.json的页面配置下配置name属性）
router.replace('home')

// 使用配置参数
router.reLaunch({ 
  path: '', // 使用path跳转，配置name时将被无效
  name: '', // 使用name跳转，优先级高于path
  delay: 500,  // 延时跳转
  query: {},  // 附带到url上的参数，将与url上的参数合并，优先级高于url上的参数（适合传递简单数据，刷新页面仍能获取）
  params: {},  // 传递的参数，可传递复杂数据，函数等（适合传递复杂数据，刷新页面后无法获取）
  ignoreGuard: false,  // 是否忽略前置守卫
})
```

### router.back

```js
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";

const router = useRouter()
const route = useRoute()

// 传递为数字时，小于60视为层级，否则视为延时时间

// 延时跳转
router.back(500)

// 返回层级
router.back(2)
router.back() // 默认为1

// 使用配置参数
router.back({ 
  delta: 1,    // 跳转层级
  delay: 500,  // 延时跳转
  query: {},  // 修改目标页面的query(不会修改网址，刷新后还会使用原网址上的参数)
  params: {},  // 传递的参数，可传递复杂数据，函数等（适合传递复杂数据，刷新页面后无法获取）
  ignoreGuard: false,  // 是否忽略前置守卫
  // 其他一些原生navigateBack方法的参数
  animationType: '',
  animationDuration: 300,
})
```

### router.go

```js
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";

const router = useRouter()
const route = useRoute()

// 传递字符串时,相当于调用router.push

// 使用path进行跳转
router.go('/pages/home/home')

// 使用name进行跳转（需要再page.json的页面配置下配置name属性）
router.go('home')

// 使用配置参数
router.go({ 
  // 跳转方式
  type: 'push' | 'pushTab' | 'replace' | 'reLaunch' | 'back',
  
  // 其他参数根据type决定
})
```

### router.beforeEach、router.afterEach

```js

/**
 * 路由守卫，可以配置多个
 * 1、接收两个参数时，使用返回值进行校验
 * 2、接收三个参数时，通过调用next传递参数校验，且后面配置的前置守卫不再执行
 * 3、请不要使用...进行接收函数参数。即这种：(...args) => {}
 * 4、使用next时请保证next仅会执行一次，否则可能会出现意料之外的问题
 * 5、不推荐使用next,如有异步请使用async配合await，使用next会因拦截在控制台报大量警告
 * 
 * 6、返回值或next传递参数规则：
 * null或false：拦截路由，不跳转
 * router.go的参数类型：重定向
 * 其他：路由通过
 */
// 

router.beforeEach(async (to, from) => {
  if (to.path.includes('my')) {
    await delay(500)
    to.query.type = 'my'
  } else if (to.path.includes('about')) {
    to.query.type = 'about'
  }
})

router.beforeEach((to, from, next) => {
  console.log(to)
  if (to.path.includes('about')) {
    setTimeout(() => {
      next({ name: 'my' })
    }, 100)
  } else {
    next()
  }
})


/**
 * 后置守卫接收两个参数
 */
router.afterEach((to, from) => {
  progress.done()
})
```

### route、to、from 类型

```typescript
export type RouteRaw = {
  path: string   // 跳转时配置的path或name匹配的path
  url: string    // 实际跳转时的url，一般或拼接上传递的query
  name?: string  // 跳转时传递的name
}

export type Route = RouteRaw & {
  query: AnyObject  // 跳转时传递的query
  params: AnyObject // 跳转时传递的params
  type: NavType     // 跳转时调用的方法名或go方法传递的type值
  method: NavMethodType  // uni原生的跳转方法名称
  ignoreGuard?: boolean  // 是否忽略前置守卫
  delay?: number     // 跳转时传递的delay
  from?: string      // 执行跳转的页面url
  // 其他跳转时传递的参数
}
```


## 使用事例

- 传递上个页面的数据及方法，在新的页面进行更新或使用

```js
// home.vue
<template>
 <view>
  <text>{{ count }}</text>
  <button @click="goAbout">去about</button>
 </view>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";
import { ref } from "vue";
const router = useRouter()
const route = useRoute()

const count = ref(0)
const addCount = (value: number = 1) => {
 count.value = count.value + value
}

const goAbout = () => {
 router.push({ 
  name: 'about', 
  params: {a: 1, count, addCount}, 
  query: {b: 2}, 
  delay: 200, 
 })
}
</script>
```

```js
// about.vue
<template>
 <view>
  <text>{{ count }}</text>
  <text>{{ route.params.count }}</text>
  <button @click="addCount">count+5</button>
  <button @click="route.params.addCount()">count+1</button>
 </view>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from "@ljhmp/uni-router-vue3";
import { computed } from "vue";
const router = useRouter()
const route = useRoute()

const count = computed(() => route.params.count)
const addCount = () => {
 route.params.addCount(5)
}
</script>
```
