import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { changeAvatar } from '@/api/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useSelectedDevice } from '@/hooks/use-device-guard'

export function ChangeAvatarForm() {
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const queryClient = useQueryClient()
  const deviceId = useSelectedDevice()

  const mutation = useActionMutation(changeAvatar, {
    successMessage: 'Foto profil diperbarui',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['device-avatar', deviceId] })
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (file) mutation.mutate(file)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <p className="text-muted-foreground text-sm">
        Unggah gambar persegi (1:1) minimal 400×400 agar tidak terpotong.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="avatar-file">Gambar foto profil</Label>
        <Input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpg,image/jpeg"
          onChange={(event) => {
            const selected = event.target.files?.[0]
            setFile(selected)
            setPreview(selected ? URL.createObjectURL(selected) : undefined)
          }}
        />
      </div>
      {preview && (
        <img src={preview} alt="Pratinjau" className="max-h-64 self-start rounded-md border" />
      )}
      <Button type="submit" disabled={mutation.isPending || !file} className="self-start">
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Simpan foto profil
      </Button>
    </form>
  )
}
