import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { DeviceSwitcher } from '@/components/layout/device-switcher'
import { BottomNav, NavigationRail } from '@/components/layout/navigation-rail'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WsBadge } from '@/components/layout/ws-badge'
import { BRAND } from '@/config/brand'
import { PasskeyDialog } from '@/features/session/passkey-dialog'
import { useDeviceSelectionSync } from '@/hooks/use-device-selection'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'
import { useShellStore } from '@/stores/shell'

/** Pages that manage their own full-height list/detail layout instead of a padded column. */
const FULL_BLEED_PATHS = new Set(['/', '/chats'])

export function AppShell() {
  const status = useConnection((state) => state.status)
  const location = useLocation()
  const immersive = useShellStore((state) => state.immersive)
  useDeviceSelectionSync()

  if (status === 'booting') {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Memuat">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  if (status !== 'connected') {
    return <Navigate to="/connect" replace />
  }

  const fullBleed = FULL_BLEED_PATHS.has(location.pathname)

  return (
    <div className="bg-background flex h-dvh overflow-clip">
      <NavigationRail />

      <div className="flex min-w-0 flex-1 flex-col overflow-clip">
        <header
          className={cn(
            'bg-card tab:px-4 flex h-14 shrink-0 items-center gap-2 border-b px-3',
            immersive && 'max-tab:hidden',
          )}
        >
          <img
            src={BRAND.logoUrl}
            alt={BRAND.shortName}
            className="tab:hidden h-7 w-auto shrink-0"
          />
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <DeviceSwitcher />
            <div className="tab:hidden flex items-center">
              <WsBadge />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main
          className={cn(
            'min-h-0 flex-1',
            fullBleed ? 'overflow-clip' : 'overflow-x-clip overflow-y-auto overscroll-contain',
          )}
        >
          {fullBleed ? (
            <Outlet />
          ) : (
            <div
              key={location.pathname}
              className="stagger tab:p-6 mx-auto flex max-w-5xl flex-col gap-5 p-4"
            >
              <Outlet />
            </div>
          )}
        </main>

        <BottomNav className={cn(immersive && 'max-tab:hidden')} />
      </div>
      <PasskeyDialog />
    </div>
  )
}
