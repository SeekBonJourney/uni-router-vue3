/// <reference types="vite/client" />
import { Route, Router } from './types'

declare global {
  interface Uni {
    $mpRouter: {
      router: Router
      history: Route[]
      tabHistory: {
        [key: string]: Route
      }
    }
  }
}
