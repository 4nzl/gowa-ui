import {
  CircleDashed,
  Contact,
  MessageCircle,
  Phone,
  Radio,
  Send,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Paths that keep this item highlighted; '/' only matches exactly. */
  match: string[]
}

/**
 * Primary navigation, in the order Master Plan v5 fixes for every breakpoint:
 * Perangkat first, Chat second, then the remaining modules. Admin modules stay
 * visible; nothing is hidden to imitate WhatsApp Web.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Perangkat', icon: Smartphone, match: ['/'] },
  { to: '/chats', label: 'Chat', icon: MessageCircle, match: ['/chats'] },
  { to: '/calls', label: 'Panggilan', icon: Phone, match: ['/calls'] },
  { to: '/status', label: 'Status', icon: CircleDashed, match: ['/status'] },
  { to: '/channels', label: 'Saluran', icon: Radio, match: ['/channels'] },
  { to: '/groups', label: 'Grup', icon: Users, match: ['/groups'] },
  { to: '/messaging', label: 'Messaging', icon: Send, match: ['/messaging', '/scheduled'] },
  { to: '/account', label: 'Akun & Kontak', icon: Contact, match: ['/account'] },
  { to: '/settings', label: 'Pengaturan', icon: Settings, match: ['/settings'] },
]

/** Index before which the rail draws a separator between messaging and directory modules. */
export const NAV_SEPARATOR_BEFORE = 5

function matches(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.match.some((path) => matches(pathname, path)))
}
