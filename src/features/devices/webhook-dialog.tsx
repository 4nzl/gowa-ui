import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDeviceWebhook, updateDeviceWebhook, type DeviceWebhookConfig } from '@/api/devices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toApiError } from '@/lib/api-error'
import { assertActiveConnection } from '@/lib/connection-guard'
import { usePrivateQuery } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'
import type { RegistryDevice } from '@/api/types'

export function DeviceWebhookDialog({
  device,
  open,
  onOpenChange,
}: {
  device: RegistryDevice
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const connectionId = useConnection((state) => state.connectionId)
  const config = usePrivateQuery({
    queryKey: ['device-webhook', device.id],
    queryFn: () => getDeviceWebhook(device.id),
    enabled: open,
  })
  const loaded =
    open &&
    connectionId !== null &&
    config.isSuccess &&
    !config.isPlaceholderData &&
    config.data !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Webhook {device.display_name || device.id}</DialogTitle>
          <DialogDescription>
            Event dari perangkat ini dikirim (POST) ke URL di bawah. Kosongkan URL lalu simpan untuk
            menonaktifkan webhook.
          </DialogDescription>
        </DialogHeader>
        {loaded ? (
          <WebhookForm
            key={`${connectionId}:${device.id}`}
            device={device}
            connectionId={connectionId}
            initial={config.data}
            onOpenChange={onOpenChange}
          />
        ) : config.isError ? (
          <p className="text-destructive text-sm">
            Konfigurasi webhook perangkat ini gagal dimuat dari server. Penyimpanan dinonaktifkan
            sampai konfigurasi berhasil dimuat.
          </p>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function WebhookForm({
  device,
  connectionId,
  initial,
  onOpenChange,
}: {
  device: RegistryDevice
  connectionId: string
  initial: DeviceWebhookConfig
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState(initial.webhook_url)
  const [secret, setSecret] = useState(initial.webhook_secret)
  const [events, setEvents] = useState(initial.webhook_events)
  const [insecureSkipVerify, setInsecureSkipVerify] = useState(initial.webhook_insecure_skip_verify)

  const save = useMutation({
    mutationFn: () => {
      assertActiveConnection(connectionId)
      return updateDeviceWebhook(device.id, {
        webhook_url: url.trim(),
        webhook_secret: secret.trim(),
        webhook_events: events.trim(),
        webhook_insecure_skip_verify: insecureSkipVerify,
      })
    },
    onSuccess: () => {
      toast.success(`Webhook ${device.id} disimpan`)
      void queryClient.invalidateQueries({ queryKey: ['device-webhook', device.id] })
      onOpenChange(false)
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="device-webhook-url">URL webhook</Label>
        <Input
          id="device-webhook-url"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="device-webhook-secret">Secret (opsional)</Label>
        <Input
          id="device-webhook-secret"
          type="password"
          autoComplete="new-password"
          placeholder="untuk menandatangani payload (X-Hub-Signature-256)"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="device-webhook-events">Event (opsional)</Label>
        <Input
          id="device-webhook-events"
          placeholder="pisahkan dengan koma; kosong = semua event"
          value={events}
          onChange={(event) => setEvents(event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="device-webhook-skip-verify" className="font-normal">
          Lewati verifikasi sertifikat TLS (tidak aman)
        </Label>
        <Switch
          id="device-webhook-skip-verify"
          checked={insecureSkipVerify}
          onCheckedChange={setInsecureSkipVerify}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Simpan webhook
        </Button>
      </DialogFooter>
    </form>
  )
}
