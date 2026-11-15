import { useState } from 'react'
import { Users } from 'lucide-react'
import { listMyGroups } from '@/api/group'
import { EmptyPane, ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { GroupActions } from '@/features/group/group-actions'
import { GroupDetail } from '@/features/group/group-detail'
import { selectedGroupJid, type GroupSelection } from '@/features/group/group-display'
import { groupListKey } from '@/features/group/group-keys'
import { GroupList } from '@/features/group/group-list'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { usePrivateQuery } from '@/lib/private-query'

function GroupsWorkspace({ deviceId }: { deviceId: string }) {
  const [selection, setSelection] = useState<GroupSelection | null>(null)
  const selectedJid = selectedGroupJid(selection, deviceId)

  const groups = usePrivateQuery({
    queryKey: groupListKey(deviceId),
    queryFn: listMyGroups,
  })

  const select = (jid: string) => setSelection({ deviceId, jid })
  const clear = () => setSelection(null)
  const selectedGroup = groups.data?.find((group) => group.JID === selectedJid)

  return (
    <ListDetailLayout
      listLabel="Daftar grup"
      detailLabel="Detail grup"
      detailOpen={selectedJid !== null}
      list={
        <>
          <ListPaneHeader
            title="Grup"
            actions={
              <GroupActions
                deviceId={deviceId}
                refreshing={groups.isFetching}
                onRefresh={() => void groups.refetch()}
                onOpenGroup={select}
              />
            }
          />
          <div className="min-h-0 flex-1">
            <GroupList
              groups={groups.data}
              isLoading={groups.isLoading}
              isFetching={groups.isFetching}
              error={groups.error}
              onRetry={() => void groups.refetch()}
              selectedJid={selectedJid}
              onSelect={(group) => select(group.JID)}
            />
          </div>
        </>
      }
      detail={
        selectedJid ? (
          <GroupDetail
            key={`${deviceId}:${selectedJid}`}
            deviceId={deviceId}
            groupJid={selectedJid}
            group={selectedGroup}
            onBack={clear}
            onLeft={clear}
          />
        ) : (
          <EmptyPane
            icon={Users}
            title="Pilih grup"
            hint="Pilih grup dari daftar untuk melihat info, mengelola anggota, dan mengubah pengaturan grup."
          />
        )
      }
    />
  )
}

export default function GroupsPage() {
  const deviceId = useSelectedDevice()

  if (!deviceId) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader title="Grup" description="Grup yang diikuti perangkat ini." />
        <DeviceGuard />
      </div>
    )
  }

  // Keyed by device so search text and selection never carry across devices.
  return <GroupsWorkspace key={deviceId} deviceId={deviceId} />
}
