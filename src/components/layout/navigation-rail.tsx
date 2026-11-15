import { Fragment, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WsBadge } from '@/components/layout/ws-badge'
import {
  NAV_ITEMS,
  NAV_SEPARATOR_BEFORE,
  activeNavItem,
  type NavItem,
} from '@/components/layout/nav-items'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { useFreshTotal } from '@/features/notify/notify-store'
import { useDeviceStore } from '@/stores/device'

/** New incoming messages for the active device, shown on the Chat item. */
function useChatBadge(): number {
  return useFreshTotal(useDeviceStore((state) => state.selectedDeviceId))
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'bg-live absolute min-w-[18px] rounded-full px-1 text-center text-[10.5px] leading-[18px] font-semibold text-[#073e29]',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  const badge = useChatBadge()
  const count = item.to === '/chats' ? badge : 0
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.to}
          aria-label={count > 0 ? `${item.label}, ${count} pesan baru` : item.label}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative grid size-11 shrink-0 place-items-center rounded-full transition-colors',
            'focus-visible:ring-ring outline-none focus-visible:ring-2',
            active
              ? 'bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary desk:before:-left-3.5 before:absolute before:-left-2 before:h-7 before:w-[3px] before:rounded-full'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          <Icon className="size-6" strokeWidth={1.8} />
          <CountBadge count={count} className="-top-0.5 -right-1" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function BrandAvatar({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/settings"
          aria-label={`Profil ${BRAND.name}`}
          className={cn(
            'grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#1e3846] bg-[#0a1014] p-0.5',
            'focus-visible:ring-ring outline-none focus-visible:ring-2',
            className,
          )}
        >
          <img src={BRAND.logoUrl} alt="" className="size-full object-contain" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{BRAND.name}</TooltipContent>
    </Tooltip>
  )
}

/** Vertical icon rail for tablet and desktop (≥691px). */
export function NavigationRail() {
  const { pathname } = useLocation()
  const active = activeNavItem(pathname)

  return (
    <nav
      aria-label="Navigasi utama"
      className="bg-sidebar text-sidebar-foreground tab:flex desk:w-[72px] hidden w-[60px] shrink-0 [scrollbar-width:none] flex-col items-center gap-1.5 overflow-y-auto border-r py-2.5"
    >
      {NAV_ITEMS.map((item, index) => (
        <Fragment key={item.to}>
          {index === NAV_SEPARATOR_BEFORE && (
            <div role="presentation" className="bg-border my-1.5 h-px w-9 shrink-0" />
          )}
          <RailLink item={item} active={active?.to === item.to} />
        </Fragment>
      ))}
      <div className="flex-1" />
      <WsBadge />
      <ThemeToggle side="right" />
      <BrandAvatar className="mt-1" />
    </nav>
  )
}

/** Horizontally scrollable bottom navigation for mobile (≤690px). */
export function BottomNav({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const active = activeNavItem(pathname)
  const activeRef = useRef<HTMLAnchorElement>(null)
  const badge = useChatBadge()

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [pathname])

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        'bg-sidebar tab:hidden shrink-0 border-t pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <div className="flex snap-x [scrollbar-width:none] gap-0.5 overflow-x-auto overscroll-x-contain px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active?.to === item.to
          return (
            <Link
              key={item.to}
              ref={isActive ? activeRef : undefined}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex h-[58px] w-[68px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] leading-tight font-medium whitespace-nowrap',
                'focus-visible:ring-ring outline-none focus-visible:ring-2',
                isActive
                  ? 'bg-accent text-foreground after:bg-primary after:absolute after:inset-x-[18px] after:bottom-0 after:h-[3px] after:rounded-full'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="size-[22px]" strokeWidth={1.8} />
              {item.to === '/chats' && <CountBadge count={badge} className="top-1 right-3.5" />}
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
