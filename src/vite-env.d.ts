/// <reference types="vite/client" />
import { Route, Router } from './types'

declare global {
  interface Uni {
    $mpRouter: {
      router: Router
      history: any[]
      guardHooks: GuardHooksConfig
    }
  }
}
