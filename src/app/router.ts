import { createRouter, createWebHistory, type Router } from 'vue-router'

import { identityRoutes } from '@/modules/identity/public'

export function createAppRouter(): Router {
  return createRouter({
    history: createWebHistory(),
    routes: [...identityRoutes, { path: '/:pathMatch(.*)*', redirect: '/' }],
  })
}
