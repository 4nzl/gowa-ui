import { useState, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { getGroupInfoFromLink } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGroupAction } from '@/features/group/use-group-action'
import { formatDate, isZeroTime } from '@/lib/format'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

export function InfoFromLinkForm({ onJoin }: { onJoin?: (link: string) => void }) {
  const [link, setLink] = useState('')

  const mutation = useGroupAction(getGroupInfoFromLink, {
    success: 'Info grup dimuat',
    failure: 'Gagal memuat info dari tautan',
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ link: link.trim() })
  }

  const info = mutation.data
  const topic = info?.topic || info?.description

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="info-link">Tautan undangan</Label>
        <Input
          id="info-link"
          placeholder="https://chat.whatsapp.com/xxxxxxxx"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={mutation.isPending} className="self-end">
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Pratinjau grup
      </Button>
      {info && (
        <div className="bg-muted/40 rounded-lg border px-3 py-1">
          <dl>
            <Row label="Nama">{info.name || '—'}</Row>
            <Row label="JID">
              <span className="font-mono text-xs">{info.group_id}</span>
            </Row>
            <Row label="Anggota">{info.participant_count}</Row>
            <Row label="Dibuat">
              {isZeroTime(info.created_at) ? '—' : formatDate(info.created_at)}
            </Row>
            <Row label="Kirim pesan">{info.is_announce ? 'Hanya admin' : 'Semua anggota'}</Row>
            <Row label="Ubah info grup">{info.is_locked ? 'Hanya admin' : 'Semua anggota'}</Row>
            <Row label="Pesan sementara">{info.is_ephemeral ? 'Aktif' : 'Nonaktif'}</Row>
          </dl>
          {topic && <p className="border-t py-2 text-sm whitespace-pre-wrap">{topic}</p>}
        </div>
      )}
      {info && onJoin && (
        <Button type="button" variant="outline" className="self-end" onClick={() => onJoin(link)}>
          Gabung ke grup ini
        </Button>
      )}
    </form>
  )
}
