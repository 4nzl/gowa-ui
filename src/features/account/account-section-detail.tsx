import type { ReactNode } from 'react'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import { RecipientBar } from '@/features/messaging/recipient-bar'
import { accountSection, type AccountSectionId } from '@/features/account/account-sections'
import { AvatarForm } from '@/features/account/avatar-form'
import { BusinessProfileForm } from '@/features/account/business-profile-form'
import { ChangeAvatarForm } from '@/features/account/change-avatar-form'
import { PrivacyView } from '@/features/account/privacy-view'
import { MyProfileCard } from '@/features/account/profile-card'
import { PushnameForm } from '@/features/account/pushname-form'
import { SECTION_ICONS } from '@/features/account/section-icons'
import { UserCheckForm } from '@/features/account/user-check-form'
import { UserInfoForm } from '@/features/account/user-info-form'

function SectionBody({ id }: { id: AccountSectionId }) {
  switch (id) {
    case 'profile':
      return (
        <>
          <PaneSection title="Profil">
            <MyProfileCard />
          </PaneSection>
          <PaneSection title="Ganti foto profil" description="Perbarui foto profil akun ini.">
            <ChangeAvatarForm />
          </PaneSection>
          <PaneSection
            title="Ganti nama tampilan"
            description="Nama yang terlihat oleh kontak WhatsApp Anda."
          >
            <PushnameForm />
          </PaneSection>
        </>
      )
    case 'privacy':
      return (
        <PaneSection
          title="Privasi saya"
          description="Pengaturan privasi saat ini. Ubah pengaturan ini dari aplikasi WhatsApp di ponsel."
        >
          <PrivacyView />
        </PaneSection>
      )
    case 'info':
      return <LookupSection id={id} form={<UserInfoForm />} />
    case 'check':
      return <LookupSection id={id} form={<UserCheckForm />} />
    case 'avatar':
      return <LookupSection id={id} form={<AvatarForm />} />
    case 'business':
      return <LookupSection id={id} form={<BusinessProfileForm />} />
  }
}

function LookupSection({ id, form }: { id: AccountSectionId; form: ReactNode }) {
  const section = accountSection(id)
  return (
    <>
      <RecipientBar showStatus={false} />
      <PaneSection title={section.label} description={section.description}>
        {form}
      </PaneSection>
    </>
  )
}

/** Detail pane for one of the own-account or lookup items. */
export function AccountSectionDetail({ id, onBack }: { id: AccountSectionId; onBack: () => void }) {
  const section = accountSection(id)
  const Icon = SECTION_ICONS[id]
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        backLabel="Kembali ke Akun & Kontak"
        leading={
          <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full">
            <Icon className="size-5" />
          </span>
        }
        title={section.label}
        subtitle={section.group === 'lookup' ? 'Alat pencarian' : 'Akun saya'}
      />
      <DetailPaneBody>
        <SectionBody id={id} />
      </DetailPaneBody>
    </div>
  )
}
