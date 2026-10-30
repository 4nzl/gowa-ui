// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConnectPage from '@/pages/connect'
import { useConnection } from '@/stores/connection'

const initialConnect = useConnection.getState().connect

describe('connect page', () => {
  afterEach(() => {
    cleanup()
    useConnection.setState({ connect: initialConnect, baseUrl: null, status: 'booting' })
  })

  it('shows an error and re-enables Connect when connecting throws', async () => {
    const connect = vi.fn().mockRejectedValue(new TypeError('crypto.randomUUID is not a function'))
    useConnection.setState({ connect, baseUrl: 'https://wa.example.com', status: 'unconfigured' })

    render(
      <MemoryRouter>
        <ConnectPage />
      </MemoryRouter>,
    )
    const button = screen.getByRole('button', { name: 'Connect' })
    fireEvent.click(button)

    expect(await screen.findByText(/Connecting failed unexpectedly/)).toBeTruthy()
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
    expect(connect).toHaveBeenCalledOnce()
  })
})
