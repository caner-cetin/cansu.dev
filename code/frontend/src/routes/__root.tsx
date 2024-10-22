import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import React from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {process.env.NODE_ENV === 'development' &&
        <div>
          <TanStackRouterDevtools />
          <ReactQueryDevtools initialIsOpen={false} />

        </div>
      }
    </>
  ),
})
