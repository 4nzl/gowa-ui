import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { createGroup } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseList } from '@/features/group/group-display'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

export function CreateGroupForm({
  deviceId,
  onCreated,
}: {
  deviceId: string
  /** Called with the new group's JID. */
  onCreated?: (groupJid: string) => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState('')

  const mutation = useGroupAction(createGroup, {
    success: 'Grup dibuat',
    failure: 'Gagal membuat grup',
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })
      if (result?.group_id) onCreated?.(result.group_id)
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ title: title.trim(), participants: parseList(participants) })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="create-group-title">Nama grup</Label>
        <Input
          id="create-group-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="create-group-participants">Anggota</Label>
        <Textarea
          id="create-group-participants"
          rows={4}
          placeholder="628xxxxxxxxxx, satu per baris atau pisahkan dengan koma"
          value={participants}
          onChange={(event) => setParticipants(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={mutation.isPending} className="self-end">
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Buat grup
      </Button>
    </form>
  )
}
