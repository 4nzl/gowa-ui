import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { joinGroupWithLink } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

export function JoinWithLinkForm({
  deviceId,
  initialLink = '',
  onJoined,
}: {
  deviceId: string
  initialLink?: string
  /** Called with the joined group's JID. */
  onJoined?: (groupJid: string) => void
}) {
  const queryClient = useQueryClient()
  const [link, setLink] = useState(initialLink)

  const mutation = useGroupAction(joinGroupWithLink, {
    success: 'Berhasil bergabung ke grup',
    failure: 'Gagal bergabung ke grup',
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })
      if (result?.group_id) onJoined?.(result.group_id)
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ link: link.trim() })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="join-link">Tautan undangan</Label>
        <Input
          id="join-link"
          placeholder="https://chat.whatsapp.com/xxxxxxxx"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={mutation.isPending} className="self-end">
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Gabung ke grup
      </Button>
    </form>
  )
}
