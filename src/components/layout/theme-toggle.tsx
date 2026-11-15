import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle({ side = 'bottom' }: { side?: 'bottom' | 'right' }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full"
          aria-label="Ganti tema"
        >
          <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Terang</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Gelap</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>Ikuti sistem</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
