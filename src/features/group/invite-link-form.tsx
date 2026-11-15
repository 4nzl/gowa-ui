import { useState } from 'react'
import { Check, Copy, Link2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getGroupInviteLink } from '@/api/group'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/features/group/confirm-dialog'
import { useGroupAction } from '@/features/group/use-group-action'
import { copyText } from '@/lib/clipboard'

/** Loads the invite link on request (admins only) and resets it behind a confirmation. */
export function InviteLinkForm({ groupJid }: { groupJid: string }) {
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const mutation = useGroupAction(getGroupInviteLink, {
    success: (_data, vars) =>
      vars.reset ? 'Tautan undangan disetel ulang' : 'Tautan undangan dimuat',
    failure: 'Gagal memuat tautan undangan',
    onSuccess: (_data, vars) => {
      setCopied(false)
      if (vars.reset) {
        setConfirmReset(false)
      }
    },
  })

  const link = mutation.data?.invite_link
  const resetting = mutation.isPending && !!mutation.variables?.reset

  const copy = async () => {
    if (!link) return
    if (await copyText(link)) {
      setCopied(true)
      toast.success('Tautan undangan tersalin')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Gagal menyalin tautan')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {link ? (
        <div className="bg-muted/40 flex items-center gap-2 rounded-lg border py-1 pr-1 pl-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs" title={link}>
            {link}
          </span>
          <Button size="sm" variant="ghost" onClick={() => void copy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Tersalin' : 'Salin'}
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => setConfirmReset(true)}
        >
          {resetting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Setel ulang tautan
        </Button>
        {!link && (
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ group_id: groupJid })}
          >
            {mutation.isPending && !resetting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Tampilkan tautan
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Setel ulang tautan undangan?"
        description="Tautan undangan lama langsung tidak berlaku. Siapa pun yang belum bergabung harus menerima tautan baru."
        confirmLabel="Setel ulang tautan"
        pending={resetting}
        onConfirm={() => mutation.mutate({ group_id: groupJid, reset: true })}
      />
    </div>
  )
}
