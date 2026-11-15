import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { setGroupTopic } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

export function SetTopicForm({
  deviceId,
  groupJid,
  initialTopic = '',
}: {
  deviceId: string
  groupJid: string
  initialTopic?: string
}) {
  const queryClient = useQueryClient()
  const [topic, setTopic] = useState(initialTopic)

  const mutation = useGroupAction(setGroupTopic, {
    success: 'Deskripsi grup diperbarui',
    failure: 'Gagal menyimpan deskripsi',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) }),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ group_id: groupJid, topic })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Label htmlFor="set-topic-value" className="sr-only">
        Deskripsi grup
      </Label>
      <Textarea
        id="set-topic-value"
        rows={3}
        placeholder="Kosongkan untuk menghapus deskripsi"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
      />
      <Button
        type="submit"
        disabled={mutation.isPending || topic === initialTopic}
        className="self-end"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Simpan deskripsi
      </Button>
    </form>
  )
}
