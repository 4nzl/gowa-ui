import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addDevice } from '@/api/devices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toApiError } from '@/lib/api-error'

export function CreateDeviceDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  const mutation = useMutation({
    mutationFn: addDevice,
    onSuccess: (device) => {
      toast.success(`Perangkat ${device.id} ditambahkan`)
      void queryClient.invalidateQueries({ queryKey: ['devices'] })
      setOpen(false)
      setDeviceId('')
      setWebhookUrl('')
      setWebhookSecret('')
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({
      device_id: deviceId.trim() || undefined,
      webhook_url: webhookUrl.trim() || undefined,
      webhook_secret: webhookSecret.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="size-10 rounded-full" aria-label="Tambah perangkat">
          <Plus className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah perangkat</DialogTitle>
          <DialogDescription>
            Mendaftarkan slot perangkat baru. Setelah itu pasangkan dengan ponsel lewat QR atau kode
            pairing. Perangkat aktif tidak berubah.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="device-id">ID perangkat (opsional)</Label>
            <Input
              id="device-id"
              placeholder="dibuat otomatis bila kosong"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">URL webhook (opsional)</Label>
            <Input
              id="webhook-url"
              placeholder="https://example.com/webhook"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-secret">Secret webhook (opsional)</Label>
            <Input
              id="webhook-secret"
              type="password"
              autoComplete="new-password"
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Tambah perangkat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
