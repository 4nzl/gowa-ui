import type { ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { Contact } from '@/api/user'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { copyText } from '@/lib/clipboard'
import { formatPhone } from '@/lib/phone'
import { useRecipientStore } from '@/stores/recipient'
import {
  contactSubtitle,
  contactTitle,
  recipientForContact,
  sectionsInGroup,
  type AccountSectionId,
} from '@/features/account/account-sections'
import { SECTION_ICONS } from '@/features/account/section-icons'

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

/** Detail of a synced contact, with shortcuts into the lookup tools. */
export function ContactDetail({
  contact,
  onBack,
  onLookup,
}: {
  contact: Contact
  onBack: () => void
  onLookup: (id: AccountSectionId) => void
}) {
  const setRecipient = useRecipientStore((state) => state.setRecipient)
  const title = contactTitle(contact)
  const phone = formatPhone(contact.jid)

  const lookup = (id: AccountSectionId) => {
    // The lookup forms read their target from the shared recipient bar.
    setRecipient(recipientForContact(contact.jid))
    onLookup(id)
  }

  const copyJid = async () =>
    (await copyText(contact.jid))
      ? toast.success('JID disalin')
      : toast.error('Browser menolak menyalin teks')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        backLabel="Kembali ke Akun & Kontak"
        leading={<ChatAvatar jid={contact.jid} name={title} className="size-10" />}
        title={title}
        subtitle={contactSubtitle(contact)}
      />
      <DetailPaneBody>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <ChatAvatar jid={contact.jid} name={title} className="size-28 text-4xl" />
          <p className="text-lg font-semibold">{title}</p>
          {phone && phone !== title && <p className="text-muted-foreground text-sm">{phone}</p>}
        </div>

        <PaneSection title="Info kontak">
          <dl>
            <InfoRow label="Nama">{contact.name?.trim() || 'Tanpa nama'}</InfoRow>
            {phone && <InfoRow label="Nomor">{phone}</InfoRow>}
            <InfoRow label="JID">
              <span className="flex items-center gap-1">
                <span className="font-mono text-xs">{contact.jid}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Salin JID" onClick={copyJid}>
                  <Copy className="size-3.5" />
                </Button>
              </span>
            </InfoRow>
          </dl>
        </PaneSection>

        <PaneSection
          title="Cari info kontak ini"
          description="Membuka alat pencarian dengan kontak ini sebagai target."
        >
          <div className="flex flex-wrap gap-2">
            {sectionsInGroup('lookup').map((section) => {
              const Icon = SECTION_ICONS[section.id]
              return (
                <Button key={section.id} variant="outline" onClick={() => lookup(section.id)}>
                  <Icon className="size-4" />
                  {section.label}
                </Button>
              )
            })}
          </div>
        </PaneSection>
      </DetailPaneBody>
    </div>
  )
}
