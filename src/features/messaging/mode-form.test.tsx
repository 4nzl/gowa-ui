import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ModeForm } from '@/features/messaging/mode-form'
import { MESSAGING_MODES } from '@/features/messaging/modes'

beforeAll(() => {
  vi.stubGlobal('window', {
    location: { origin: 'http://localhost', pathname: '/' },
  })
})

function render(node: React.ReactNode) {
  const client = new QueryClient()
  return renderToStaticMarkup(<QueryClientProvider client={client}>{node}</QueryClientProvider>)
}

describe('messaging mode forms', () => {
  it.each(MESSAGING_MODES.map((mode) => [mode.id]))('renders a form with cURL for %s', (id) => {
    const html = render(<ModeForm mode={id} messageId="3EB0ABC" />)
    expect(html).toContain('<form')
    expect(html).toContain('type="submit"')
    expect(html).toContain('cURL')
  })
})
