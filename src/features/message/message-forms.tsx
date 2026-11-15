import { useState, type FormEvent, type ReactNode } from 'react'
import {
  deleteRequest,
  forwardRequest,
  playedRequest,
  reactRequest,
  readRequest,
  revokeRequest,
  starRequest,
  unstarRequest,
  updateRequest,
} from '@/api/message'
import { exec, type ApiRequest } from '@/api/request'
import { FormActions } from '@/components/shared/curl-dialog'
import { ResultPanel } from '@/components/shared/result-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useRecipientJid } from '@/stores/recipient'
import type { SendResult } from '@/api/send'
import { ScheduleFields } from '@/features/send/schedule-fields'
import { useScheduleDraft } from '@/features/send/use-schedule-draft'

export interface MessageActionProps {
  messageId: string
}

/** Shared shell: submit + cURL + result. Recipient and message ID come from the workspace. */
function MessageActionForm({
  messageId,
  submitLabel,
  successMessage,
  request,
  children,
  extraValid = true,
  onSuccess,
}: MessageActionProps & {
  submitLabel: string
  successMessage: string
  request: (messageId: string, phone: string) => ApiRequest
  children?: ReactNode
  extraValid?: boolean
  onSuccess?: () => void
}) {
  const jid = useRecipientJid()
  const mutation = useActionMutation(
    (vars: { messageId: string; phone: string }) =>
      // Some actions answer without results; only a scheduled forward carries a schedule.
      exec<SendResult | undefined>(request(vars.messageId, vars.phone)),
    { successMessage: (r) => (r?.schedule_id ? r.status : successMessage), onSuccess },
  )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ messageId: messageId.trim(), phone: jid })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {children}
      <FormActions
        submitLabel={submitLabel}
        pending={mutation.isPending}
        disabled={!messageId.trim() || !jid || !extraValid}
        request={request(messageId.trim(), jid)}
      />
      {mutation.isSuccess && (
        <ResultPanel
          result={mutation.data?.schedule_id ? mutation.data : { status: successMessage }}
        />
      )}
    </form>
  )
}

export function ReactForm({ messageId }: MessageActionProps) {
  const [emoji, setEmoji] = useState('')
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Kirim reaksi"
      successMessage="Reaksi terkirim"
      extraValid={emoji.trim().length > 0}
      request={(id, phone) => reactRequest(id, { phone, emoji })}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="react-emoji">Emoji</Label>
        <Input
          id="react-emoji"
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
          placeholder="👍"
        />
      </div>
    </MessageActionForm>
  )
}

export function UpdateForm({ messageId }: MessageActionProps) {
  const [message, setMessage] = useState('')
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Simpan perubahan"
      successMessage="Pesan diperbarui"
      extraValid={message.trim().length > 0}
      request={(id, phone) => updateRequest(id, { phone, message })}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="update-message">Teks baru</Label>
        <Textarea
          id="update-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
    </MessageActionForm>
  )
}

export function DeleteForm({ messageId }: MessageActionProps) {
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Hapus untuk saya"
      successMessage="Pesan dihapus untuk Anda"
      request={(id, phone) => deleteRequest(id, { phone })}
    />
  )
}

export function RevokeForm({ messageId }: MessageActionProps) {
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Tarik pesan"
      successMessage="Pesan ditarik untuk semua orang"
      request={(id, phone) => revokeRequest(id, { phone })}
    />
  )
}

export function ReadForm({ messageId }: MessageActionProps) {
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Tandai dibaca"
      successMessage="Ditandai dibaca"
      request={(id, phone) => readRequest(id, { phone })}
    />
  )
}

export function PlayedForm({ messageId }: MessageActionProps) {
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Tandai diputar"
      successMessage="Tanda diputar terkirim"
      request={(id, phone) => playedRequest(id, { phone })}
    />
  )
}

export function StarForm({ messageId }: MessageActionProps) {
  const [starred, setStarred] = useState(true)
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel={starred ? 'Beri bintang' : 'Lepas bintang'}
      successMessage={starred ? 'Pesan diberi bintang' : 'Bintang dilepas'}
      request={(id, phone) => (starred ? starRequest(id, { phone }) : unstarRequest(id, { phone }))}
    >
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={starred ? 'default' : 'outline'}
          onClick={() => setStarred(true)}
        >
          Bintang
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!starred ? 'default' : 'outline'}
          onClick={() => setStarred(false)}
        >
          Lepas bintang
        </Button>
      </div>
    </MessageActionForm>
  )
}

export function ForwardForm({ messageId }: MessageActionProps) {
  const [reupload, setReupload] = useState(false)
  const { draft, patch, reset } = useScheduleDraft()
  return (
    <MessageActionForm
      messageId={messageId}
      submitLabel="Teruskan pesan"
      successMessage="Pesan diteruskan"
      onSuccess={reset}
      request={(id, phone) => forwardRequest(id, { phone, force_reupload: reupload, ...draft })}
    >
      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={reupload}
          onChange={(event) => setReupload(event.target.checked)}
        />
        Paksa unggah ulang media (force_reupload)
      </label>
      <ScheduleFields draft={draft} patch={patch} />
    </MessageActionForm>
  )
}
