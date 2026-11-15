import { useMemo, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import type { Contact } from '@/api/user'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_GROUPS,
  CONTACT_RENDER_LIMIT,
  contactSubtitle,
  contactTitle,
  filterContacts,
  sectionsInGroup,
  sortContacts,
  type AccountSection,
  type AccountSectionId,
} from '@/features/account/account-sections'
import { SECTION_ICONS } from '@/features/account/section-icons'
import { useContacts } from '@/features/account/use-contacts'

const rowClass = (selected: boolean) =>
  cn(
    'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
    'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
    selected ? 'bg-accent' : 'hover:bg-accent/60',
  )

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground px-4 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
      {children}
    </p>
  )
}

function SectionRow({
  section,
  selected,
  onSelect,
}: {
  section: AccountSection
  selected: boolean
  onSelect: () => void
}) {
  const Icon = SECTION_ICONS[section.id]
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={rowClass(selected)}
      >
        <span className="bg-muted text-muted-foreground grid size-12 shrink-0 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="truncate text-[15.5px] font-medium">{section.label}</span>
          <span className="text-muted-foreground truncate text-[13.5px]">
            {section.description}
          </span>
        </span>
      </button>
    </li>
  )
}

function ContactRow({
  contact,
  selected,
  onSelect,
}: {
  contact: Contact
  selected: boolean
  onSelect: () => void
}) {
  const title = contactTitle(contact)
  const subtitle = contactSubtitle(contact)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={rowClass(selected)}
      >
        <ChatAvatar jid={contact.jid} name={title} className="size-12 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="truncate text-[15.5px] font-medium">{title}</span>
          {subtitle !== title && (
            <span className="text-muted-foreground truncate text-[13.5px]">{subtitle}</span>
          )}
        </span>
      </button>
    </li>
  )
}

/** List pane body: own-account items, lookup tools, then the synced contacts. */
export function AccountList({
  selectedSection,
  selectedContactJid,
  onSelectSection,
  onSelectContact,
}: {
  selectedSection: AccountSectionId | null
  selectedContactJid: string | null
  onSelectSection: (id: AccountSectionId) => void
  onSelectContact: (contact: Contact) => void
}) {
  const contacts = useContacts()
  const [query, setQuery] = useState('')
  const sorted = useMemo(() => sortContacts(contacts.data?.data ?? []), [contacts.data])
  const visible = useMemo(() => filterContacts(sorted, query), [sorted, query])
  const shown = visible.slice(0, CONTACT_RENDER_LIMIT)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {ACCOUNT_GROUPS.map((group) => (
        <div key={group.id}>
          <GroupLabel>{group.label}</GroupLabel>
          <ul>
            {sectionsInGroup(group.id).map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                selected={selectedSection === section.id}
                onSelect={() => onSelectSection(section.id)}
              />
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-card sticky top-0 z-10 pb-2">
        <GroupLabel>
          {contacts.data ? `Kontak (${contacts.data.data?.length ?? 0})` : 'Kontak'}
        </GroupLabel>
        <div className="px-3">
          <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau nomor"
              aria-label="Cari kontak"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery('')}>
                <X className="text-muted-foreground size-4" />
              </button>
            )}
          </label>
        </div>
      </div>

      {contacts.isLoading ? (
        <div className="flex justify-center p-6" role="status" aria-label="Memuat kontak">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ) : contacts.error ? (
        <p className="text-destructive p-6 text-center text-sm">
          Gagal memuat kontak: {toApiError(contacts.error).message}
        </p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">
          {query ? 'Tidak ada kontak yang cocok.' : 'Belum ada kontak yang tersinkron.'}
        </p>
      ) : (
        <ul className="pb-[env(safe-area-inset-bottom)]">
          {shown.map((contact) => (
            <ContactRow
              key={contact.jid}
              contact={contact}
              selected={selectedContactJid === contact.jid}
              onSelect={() => onSelectContact(contact)}
            />
          ))}
          {visible.length > shown.length && (
            <li className="text-muted-foreground px-4 py-3 text-center text-xs">
              Menampilkan {shown.length} dari {visible.length} kontak. Persempit pencarian untuk
              melihat lainnya.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
