import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, MessageSquare, PhoneIncoming, PhoneMissed } from 'lucide-react'
import { toast } from 'sonner'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { CallRejectForm } from '@/features/call/call-reject-form'
import { callPlatformLabel, callStatusLabel, type CallRecord } from '@/features/call/call-history'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { chatSubtitle, chatTitle } from '@/features/chat/chat-format'
import { openChatState } from '@/features/chat/open-chat'
import { copyText } from '@/lib/clipboard'
import { formatDate } from '@/lib/format'
import { formatPhone } from '@/lib/phone'

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function CopyValue({ value, label }: { value: string; label: string }) {
  const copy = async () =>
    (await copyText(value))
      ? toast.success(`${label} disalin`)
      : toast.error('Browser menolak menyalin teks')
  return (
    <span className="flex items-center gap-1">
      <span className="font-mono text-xs">{value}</span>
      <Button variant="ghost" size="icon-sm" aria-label={`Salin ${label}`} onClick={copy}>
        <Copy className="size-3.5" />
      </Button>
    </span>
  )
}

export function CallDetail({ call, onBack }: { call: CallRecord; onBack: () => void }) {
  const navigate = useNavigate()
  const title = chatTitle({ jid: call.chatJid, name: call.chatName })
  const phone = formatPhone(call.chatJid) ?? formatPhone(call.senderJid)
  const platform = callPlatformLabel(call)
  const Icon = call.autoRejected ? PhoneMissed : PhoneIncoming

  const openChat = () => navigate('/chats', { state: openChatState(call.chatJid, call.chatName) })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        backLabel="Kembali ke daftar panggilan"
        leading={<ChatAvatar jid={call.chatJid} name={title} className="size-10" />}
        title={title}
        subtitle={`${callStatusLabel(call)} · ${formatDate(call.timestamp)}`}
        actions={
          <Button variant="outline" size="sm" onClick={openChat}>
            <MessageSquare className="size-4" />
            <span className="max-tab:sr-only">Buka chat</span>
          </Button>
        }
      />
      <DetailPaneBody>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <ChatAvatar jid={call.chatJid} name={title} className="size-28 text-4xl" />
          <p className="text-lg font-semibold">{title}</p>
          {phone && phone !== title && <p className="text-muted-foreground text-sm">{phone}</p>}
          <p
            className={
              call.autoRejected
                ? 'text-destructive flex items-center gap-1.5 text-sm font-medium'
                : 'text-primary flex items-center gap-1.5 text-sm font-medium'
            }
          >
            <Icon className="size-4" />
            {callStatusLabel(call)}
          </p>
          <Button className="mt-2" onClick={openChat}>
            <MessageSquare className="size-4" />
            Buka chat
          </Button>
        </div>

        <PaneSection
          title="Info panggilan"
          description={
            call.autoRejected
              ? 'GOWA menolak panggilan ini secara otomatis.'
              : 'GOWA hanya mencatat bahwa panggilan masuk; server tidak tahu apakah panggilan diangkat atau terlewat.'
          }
        >
          <dl>
            <InfoRow label="Penelepon">{title}</InfoRow>
            <InfoRow label="Nomor">{phone ?? chatSubtitle({ jid: call.chatJid })}</InfoRow>
            <InfoRow label="JID">
              <CopyValue value={call.chatJid} label="JID" />
            </InfoRow>
            <InfoRow label="Waktu">{formatDate(call.timestamp)}</InfoRow>
            <InfoRow label="Status">{callStatusLabel(call)}</InfoRow>
            {call.groupJid && (
              <InfoRow label="Panggilan grup">
                <CopyValue value={call.groupJid} label="JID grup" />
              </InfoRow>
            )}
            {platform && <InfoRow label="Platform penelepon">{platform}</InfoRow>}
            {call.callId && (
              <InfoRow label="Call ID">
                <CopyValue value={call.callId} label="Call ID" />
              </InfoRow>
            )}
          </dl>
        </PaneSection>

        <PaneSection
          title="Tolak panggilan"
          tone="danger"
          description="Penolakan hanya berlaku selama panggilan masih berdering. Untuk panggilan yang sudah selesai, permintaan ini tidak berpengaruh."
        >
          <CallRejectForm
            key={call.key}
            initialCallerJid={call.chatJid}
            initialCallId={call.callId}
            hint=""
          />
        </PaneSection>
      </DetailPaneBody>
    </div>
  )
}
