import { BRAND } from '@/config/brand'
import { SETTINGS_ICONS } from '@/features/settings/section-icons'
import {
  SETTINGS_SECTIONS,
  profileSummary,
  type SettingsSectionId,
} from '@/features/settings/settings-sections'
import { useActiveDevice } from '@/features/settings/use-active-device'
import { cn } from '@/lib/utils'

const rowClass = (selected: boolean) =>
  cn(
    'flex w-full items-center gap-3 px-3 text-left transition-colors',
    'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
    selected ? 'bg-accent' : 'hover:bg-accent/60',
  )

/** List pane body: the profile header row, then one row per settings section. */
export function SettingsList({
  selected,
  onSelect,
}: {
  selected: SettingsSectionId | null
  onSelect: (id: SettingsSectionId) => void
}) {
  const { device, selectedId } = useActiveDevice()
  const profile = profileSummary(device, selectedId)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <button
        type="button"
        onClick={() => onSelect('profile')}
        aria-current={selected === 'profile' ? 'true' : undefined}
        className={cn(rowClass(selected === 'profile'), 'min-h-[88px] py-3')}
      >
        <img
          src={BRAND.logoUrl}
          alt=""
          className="bg-muted size-16 shrink-0 rounded-full border object-contain p-1"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-medium">{profile.title}</span>
          <span className="text-muted-foreground truncate text-[13.5px]">{profile.subtitle}</span>
        </span>
      </button>

      <ul className="border-t">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = SETTINGS_ICONS[section.id]
          const isSelected = selected === section.id
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(rowClass(isSelected), 'min-h-[68px]')}
              >
                <span className="text-muted-foreground grid size-10 shrink-0 place-items-center">
                  <Icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
                  <span className="truncate text-[15.5px]">{section.label}</span>
                  <span className="text-muted-foreground truncate text-[13.5px]">
                    {section.description}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
