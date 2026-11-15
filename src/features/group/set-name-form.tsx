import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { setGroupName } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

export function SetNameForm({
  deviceId,
  groupJid,
  initialName = '',
}: {
  deviceId: string
  groupJid: string
  initialName?: string
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialName)

  const mutation = useGroupAction(setGroupName, {
    success: 'Nama grup diperbarui',
    failure: 'Gagal menyimpan nama grup',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) }),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ group_id: groupJid, name: name.trim() })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Label htmlFor="set-name-value" className="sr-only">
        Nama grup
      </Label>
      <Input
        id="set-name-value"
        value={name}
        maxLength={100}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Button
        type="submit"
        disabled={mutation.isPending || !name.trim() || name.trim() === initialName}
        className="self-end"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Simpan nama
      </Button>
    </form>
  )
}
