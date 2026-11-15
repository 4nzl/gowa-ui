import { useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ImageMinus, Loader2, Upload } from 'lucide-react'
import { setGroupPhoto } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/features/group/confirm-dialog'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

export function SetPhotoForm({ deviceId, groupJid }: { deviceId: string; groupJid: string }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | undefined>(undefined)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const mutation = useGroupAction(setGroupPhoto, {
    failure: 'Gagal memperbarui foto grup',
    success: (result) => (result?.picture_id ? 'Foto grup diperbarui' : 'Foto grup dihapus'),
    onSuccess: () => {
      setPhoto(undefined)
      setConfirmRemove(false)
      if (fileInput.current) fileInput.current.value = ''
      void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (photo) mutation.mutate({ group_id: groupJid, photo })
  }

  const removing = mutation.isPending && !mutation.variables?.photo

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Label htmlFor="set-photo-file" className="sr-only">
        Foto grup
      </Label>
      <Input
        ref={fileInput}
        id="set-photo-file"
        type="file"
        accept="image/*"
        onChange={(event) => setPhoto(event.target.files?.[0])}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => setConfirmRemove(true)}
        >
          <ImageMinus className="size-4" />
          Hapus foto
        </Button>
        <Button type="submit" disabled={mutation.isPending || !photo}>
          {mutation.isPending && !removing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Unggah foto
        </Button>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Hapus foto grup?"
        description="Foto grup dihapus untuk semua anggota."
        confirmLabel="Hapus foto"
        pending={removing}
        onConfirm={() => mutation.mutate({ group_id: groupJid })}
      />
    </form>
  )
}
