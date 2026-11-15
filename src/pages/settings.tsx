import { useState } from 'react'
import { ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { SettingsDetail } from '@/features/settings/settings-detail'
import { SettingsList } from '@/features/settings/settings-list'
import type { SettingsSectionId } from '@/features/settings/settings-sections'

export default function SettingsPage() {
  const [selected, setSelected] = useState<SettingsSectionId | null>(null)

  return (
    <ListDetailLayout
      listLabel="Bagian pengaturan"
      detailLabel="Detail pengaturan"
      detailOpen={selected !== null}
      list={
        <>
          <ListPaneHeader title="Pengaturan" />
          <SettingsList selected={selected} onSelect={setSelected} />
        </>
      }
      detail={
        <SettingsDetail key={selected ?? 'none'} id={selected} onBack={() => setSelected(null)} />
      }
    />
  )
}
