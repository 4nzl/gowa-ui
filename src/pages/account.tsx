import { useState } from 'react'
import { CircleUserRound } from 'lucide-react'
import type { Contact } from '@/api/user'
import { EmptyPane, ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { AccountList } from '@/features/account/account-list'
import { AccountSectionDetail } from '@/features/account/account-section-detail'
import type { AccountSectionId } from '@/features/account/account-sections'
import { ContactDetail } from '@/features/account/contact-detail'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

type Selection =
  | { deviceId: string; kind: 'section'; id: AccountSectionId }
  | { deviceId: string; kind: 'contact'; contact: Contact }

export default function AccountPage() {
  const device = useSelectedDevice()
  const [stored, setSelection] = useState<Selection | null>(null)
  // A selection made on another device never leaks into this one.
  const selection = stored && stored.deviceId === device ? stored : null

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader
          title="Akun & Kontak"
          description="Profil, privasi, kontak, dan alat pencarian untuk perangkat aktif."
        />
        <DeviceGuard />
      </div>
    )
  }

  const openSection = (id: AccountSectionId) =>
    setSelection({ deviceId: device, kind: 'section', id })
  const close = () => setSelection(null)

  return (
    <ListDetailLayout
      listLabel="Menu akun dan daftar kontak"
      detailLabel="Detail akun"
      detailOpen={selection !== null}
      list={
        <>
          <ListPaneHeader title="Akun & Kontak" />
          <AccountList
            key={device}
            selectedSection={selection?.kind === 'section' ? selection.id : null}
            selectedContactJid={selection?.kind === 'contact' ? selection.contact.jid : null}
            onSelectSection={openSection}
            onSelectContact={(contact) =>
              setSelection({ deviceId: device, kind: 'contact', contact })
            }
          />
        </>
      }
      detail={
        selection?.kind === 'section' ? (
          <AccountSectionDetail
            key={`${device}:${selection.id}`}
            id={selection.id}
            onBack={close}
          />
        ) : selection?.kind === 'contact' ? (
          <ContactDetail
            key={`${device}:${selection.contact.jid}`}
            contact={selection.contact}
            onBack={close}
            onLookup={openSection}
          />
        ) : (
          <EmptyPane
            icon={CircleUserRound}
            title="Pilih menu atau kontak"
            hint="Kelola profil dan privasi perangkat aktif, cari info pengguna, atau buka kontak yang tersinkron."
          />
        )
      }
    />
  )
}
