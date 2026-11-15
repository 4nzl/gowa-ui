import { useId, useState, type FormEvent } from 'react'
import { Loader2, PhoneOff } from 'lucide-react'
import { rejectCall } from '@/api/call'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { ResultPanel } from '@/components/shared/result-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionMutation } from '@/hooks/use-action-mutation'

/**
 * POST /call/reject. Prefill with `initialCallerJid`/`initialCallId` (remount
 * with a new `key` to switch calls). WhatsApp only accepts the rejection while
 * the call is still ringing.
 */
export function CallRejectForm({
  initialCallerJid = '',
  initialCallId = '',
  hint = 'Isi caller JID dan call ID dari event webhook call.offer, lalu kirim selagi panggilan masih berdering.',
}: {
  initialCallerJid?: string
  initialCallId?: string
  hint?: string
}) {
  const id = useId()
  const [callerJid, setCallerJid] = useState(initialCallerJid)
  const [callId, setCallId] = useState(initialCallId)
  const deviceId = useSelectedDevice() ?? undefined
  const mutation = useActionMutation(
    (payload: { caller_jid: string; call_id: string }) => rejectCall(payload, deviceId),
    { successMessage: 'Panggilan ditolak' },
  )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ caller_jid: callerJid.trim(), call_id: callId.trim() })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-caller-jid`}>Caller JID</Label>
        <Input
          id={`${id}-caller-jid`}
          placeholder="628xxxxxxxxxx@s.whatsapp.net"
          value={callerJid}
          onChange={(event) => setCallerJid(event.target.value)}
          autoComplete="off"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-call-id`}>Call ID</Label>
        <Input
          id={`${id}-call-id`}
          placeholder="Call ID dari event webhook"
          value={callId}
          onChange={(event) => setCallId(event.target.value)}
          autoComplete="off"
          required
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={mutation.isPending || !callerJid.trim() || !callId.trim()}
        className="self-start"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PhoneOff className="size-4" />
        )}
        Tolak panggilan
      </Button>
      <ResultPanel result={mutation.data} />
    </form>
  )
}
