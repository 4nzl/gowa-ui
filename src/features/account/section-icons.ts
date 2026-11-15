import type { ComponentType } from 'react'
import {
  CircleUserRound,
  Image,
  ShieldCheck,
  Store,
  UserRoundCheck,
  UserRoundSearch,
} from 'lucide-react'
import type { AccountSectionId } from '@/features/account/account-sections'

export const SECTION_ICONS: Record<
  AccountSectionId,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  profile: CircleUserRound,
  privacy: ShieldCheck,
  info: UserRoundSearch,
  check: UserRoundCheck,
  avatar: Image,
  business: Store,
}
