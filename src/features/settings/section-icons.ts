import type { ComponentType } from 'react'
import {
  BellOff,
  Database,
  Info,
  Palette,
  PlugZap,
  Server,
  Smartphone,
  UserRound,
} from 'lucide-react'
import type { SettingsSectionId } from '@/features/settings/settings-sections'

export const SETTINGS_ICONS: Record<
  SettingsSectionId,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  profile: UserRound,
  appearance: Palette,
  connection: PlugZap,
  device: Smartphone,
  server: Server,
  notifications: BellOff,
  'local-data': Database,
  about: Info,
}
