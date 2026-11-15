import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BottomNav, NavigationRail } from '@/components/layout/navigation-rail'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { TooltipProvider } from '@/components/ui/tooltip'

function render(node: React.ReactNode, path: string) {
  return renderToStaticMarkup(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
    </TooltipProvider>,
  )
}

function labelOrder(html: string, attr: RegExp): string[] {
  return [...html.matchAll(attr)].map((match) => match[1].replace('&amp;', '&'))
}

describe('NavigationRail', () => {
  it('renders every module in order with accessible labels', () => {
    const html = render(<NavigationRail />, '/')
    const labels = labelOrder(html, /<a [^>]*aria-label="([^"]+)"/g).filter((label) =>
      NAV_ITEMS.some((item) => item.label === label),
    )
    expect(labels).toEqual(NAV_ITEMS.map((item) => item.label))
  })

  it('marks the matching module as the current page', () => {
    const html = render(<NavigationRail />, '/scheduled')
    expect(html).toMatch(/aria-label="Messaging" aria-current="page"/)
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
  })
})

describe('BottomNav', () => {
  it('shows text labels in the same order', () => {
    const html = render(<BottomNav />, '/chats')
    const labels = labelOrder(html, /<span class="max-w-full truncate">([^<]+)<\/span>/g)
    expect(labels).toEqual(NAV_ITEMS.map((item) => item.label))
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
  })
})
