import type { ReactNode } from 'react'
import {
  ChevronRight,
  DoorOpen,
  MessageSquare,
  Pencil,
  Timer,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { GroupInfo } from '@/api/group'
import { PaneSection } from '@/components/layout/list-detail'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  addressingLabel,
  formatTimer,
  groupParticipantCount,
  memberAddLabel,
  shortId,
} from '@/features/group/group-display'
import { toApiError } from '@/lib/api-error'
import { formatDate, formatDay, isZeroTime } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-4">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="font-heading text-xl leading-none font-semibold">{value}</span>
    </div>
  )
}

function SettingRow({
  icon: Icon,
  label,
  value,
  restricted,
}: {
  icon: LucideIcon
  label: string
  value: string
  restricted: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      <span className={cn('text-sm', restricted ? 'font-medium' : 'text-muted-foreground')}>
        {value}
      </span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

/** Rare states worth calling out; the everyday settings get their own rows. */
function flagBadges(info: GroupInfo) {
  const flags: { label: string; variant: 'destructive' | 'secondary' | 'outline' }[] = []
  if (info.Suspended) flags.push({ label: 'Ditangguhkan', variant: 'destructive' })
  if (info.IsParent) flags.push({ label: 'Induk komunitas', variant: 'secondary' })
  if (info.IsDefaultSubGroup) flags.push({ label: 'Subgrup komunitas', variant: 'secondary' })
  if (info.LinkedParentJID) flags.push({ label: 'Tertaut ke komunitas', variant: 'outline' })
  if (info.IsIncognito) flags.push({ label: 'Incognito', variant: 'outline' })
  return flags
}

export function GroupOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Memuat info grup">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

/** Read-only summary of `/group/info`; the query lives in GroupDetail. */
export function GroupOverview({
  info,
  isLoading,
  error,
}: {
  info: GroupInfo | undefined
  isLoading: boolean
  error: Error | null
}) {
  if (isLoading) return <GroupOverviewSkeleton />
  if (error) {
    return (
      <PaneSection title="Info grup" tone="danger">
        <p className="text-destructive text-sm">
          Gagal memuat info grup: {toApiError(error).message}
        </p>
      </PaneSection>
    )
  }
  if (!info) return null

  const participants = info.Participants ?? []
  const adminCount = participants.filter((participant) => participant.IsAdmin).length
  const owner = info.OwnerPN || info.OwnerJID
  const timer = info.IsEphemeral && info.DisappearingTimer ? info.DisappearingTimer : 0
  const badges = flagBadges(info)

  return (
    <>
      <PaneSection title="Deskripsi">
        {info.Topic ? (
          <>
            <p className="text-sm whitespace-pre-wrap">{info.Topic}</p>
            {info.TopicSetAt && !isZeroTime(info.TopicSetAt) && (
              <p className="text-muted-foreground mt-2 text-xs">
                Diperbarui {formatDay(info.TopicSetAt)}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Belum ada deskripsi.</p>
        )}
      </PaneSection>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Anggota" value={String(groupParticipantCount(info))} />
        {participants.length > 0 && <StatTile label="Admin" value={String(adminCount)} />}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((flag) => (
            <Badge key={flag.label} variant={flag.variant}>
              {flag.label}
            </Badge>
          ))}
        </div>
      )}

      <PaneSection title="Siapa yang boleh">
        <div className="flex flex-col divide-y">
          <SettingRow
            icon={MessageSquare}
            label="Kirim pesan"
            value={info.IsAnnounce ? 'Hanya admin' : 'Semua anggota'}
            restricted={!!info.IsAnnounce}
          />
          <SettingRow
            icon={Pencil}
            label="Ubah info grup"
            value={info.IsLocked ? 'Hanya admin' : 'Semua anggota'}
            restricted={!!info.IsLocked}
          />
          <SettingRow
            icon={UserPlus}
            label="Tambah anggota"
            value={memberAddLabel(info.MemberAddMode)}
            restricted={info.MemberAddMode === 'admin_add'}
          />
          <SettingRow
            icon={DoorOpen}
            label="Gabung lewat tautan undangan"
            value={info.IsJoinApprovalRequired ? 'Perlu persetujuan' : 'Langsung'}
            restricted={!!info.IsJoinApprovalRequired}
          />
          <SettingRow
            icon={Timer}
            label="Pesan sementara"
            value={timer ? formatTimer(timer) : 'Nonaktif'}
            restricted={!!timer}
          />
        </div>
      </PaneSection>

      <PaneSection title="Informasi">
        <dl>
          <InfoRow label="JID">
            <span className="font-mono text-xs">{info.JID}</span>
          </InfoRow>
          <InfoRow label="Pemilik grup">
            {owner ? (formatPhone(owner) ?? shortId(owner)) : '—'}
          </InfoRow>
          <InfoRow label="Dibuat">
            {isZeroTime(info.GroupCreated) ? '—' : formatDate(info.GroupCreated)}
          </InfoRow>
          {info.NameSetAt && !isZeroTime(info.NameSetAt) && (
            <InfoRow label="Nama diubah">{formatDay(info.NameSetAt)}</InfoRow>
          )}
          <InfoRow label="Mode alamat">{addressingLabel(info.AddressingMode)}</InfoRow>
          {info.CreatorCountryCode && (
            <InfoRow label="Wilayah pembuat">{info.CreatorCountryCode}</InfoRow>
          )}
        </dl>
        <details className="group/raw mt-3 rounded-lg border">
          <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 p-3 text-xs font-medium select-none">
            <ChevronRight className="size-3.5 transition-transform group-open/raw:rotate-90" />
            Respons mentah
          </summary>
          <pre className="text-muted-foreground overflow-x-auto border-t p-3 font-mono text-xs">
            {JSON.stringify(info, null, 2)}
          </pre>
        </details>
      </PaneSection>
    </>
  )
}
