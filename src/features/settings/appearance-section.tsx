import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { PaneSection } from '@/components/layout/list-detail'
import {
  THEME_CHOICES,
  normalizeTheme,
  type ThemeChoice,
} from '@/features/settings/settings-sections'
import { cn } from '@/lib/utils'

const THEME_ICONS: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const current = normalizeTheme(theme)

  return (
    <>
      <PaneSection
        title="Tema"
        description="Disimpan di browser ini. Ikuti sistem memakai pengaturan terang/gelap perangkat."
      >
        <div role="radiogroup" aria-label="Tema" className="grid gap-2 sm:grid-cols-3">
          {THEME_CHOICES.map((choice) => {
            const Icon = THEME_ICONS[choice.value]
            const checked = current === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setTheme(choice.value)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                  'focus-visible:ring-ring outline-none focus-visible:ring-2',
                  checked ? 'border-primary bg-primary/5' : 'hover:bg-accent/60',
                )}
              >
                <Icon className="text-muted-foreground size-5 shrink-0" />
                <span className="flex-1 font-medium">{choice.label}</span>
                {checked && <Check className="text-primary size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PaneSection>

      <PaneSection
        title="Pratinjau"
        description={
          current === 'system'
            ? `Saat ini sistem memakai tema ${resolvedTheme === 'dark' ? 'gelap' : 'terang'}.`
            : undefined
        }
      >
        <div
          aria-hidden
          className="chat-wallpaper flex flex-col gap-1.5 overflow-hidden rounded-lg border p-3 text-[14px]"
        >
          <div className="bg-bubble-in max-w-[75%] self-start rounded-lg rounded-tl-none px-2.5 py-1.5 shadow-xs">
            Halo, pesanan saya sudah dikirim?
            <span className="text-muted-foreground ml-2 align-bottom text-[11px]">09.41</span>
          </div>
          <div className="bg-bubble-out max-w-[75%] self-end rounded-lg rounded-tr-none px-2.5 py-1.5 shadow-xs">
            Sudah, kurir berangkat pagi ini.
            <span className="text-muted-foreground ml-2 align-bottom text-[11px]">09.42</span>
          </div>
        </div>
      </PaneSection>
    </>
  )
}
