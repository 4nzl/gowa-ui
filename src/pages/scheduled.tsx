import { useState, type ComponentType } from 'react'
import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Search,
  XCircle,
} from 'lucide-react'
import {
  listSchedules,
  pauseSchedule,
  resumeSchedule,
  cancelSchedule,
  type ScheduledSend,
  type ScheduleStatus,
} from '@/api/schedule'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { usePrivateQuery } from '@/lib/private-query'
import {
  SCHEDULE_MESSAGE_TYPES,
  SCHEDULE_STATUS_FILTERS,
  SCHEDULE_STATUS_LABELS,
  messageTypeLabel,
  recurrenceLabel,
} from '@/features/messaging/schedule-labels'

const PAGE_SIZE = 25

type ScheduleAction = 'pause' | 'resume' | 'cancel'

function statusVariant(status: ScheduledSend['status']) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed' || status === 'active' || status === 'running')
    return 'default' as const
  return 'secondary' as const
}

function IconAction({
  icon: Icon,
  label,
  variant = 'outline',
  disabled,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  variant?: 'outline' | 'destructive'
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ScheduleRow({
  item,
  busy,
  run,
}: {
  item: ScheduledSend
  busy: boolean
  run: (action: ScheduleAction, item: ScheduledSend) => void
}) {
  // Mirrors the server: a running send, or a finished one, takes no action.
  const canCancel = item.status === 'active' || item.status === 'paused' || item.status === 'failed'

  return (
    <TableRow>
      <TableCell className="max-w-[16rem] font-medium">
        <div className="truncate" title={item.phone}>
          <span className="text-muted-foreground">{messageTypeLabel(item.message_type)}</span> ·{' '}
          {item.phone}
        </div>
      </TableCell>
      <TableCell className="max-w-[18rem]">
        <div className="truncate">{item.summary || 'Pesan terjadwal'}</div>
        {item.last_error && (
          <div className="text-destructive truncate text-xs" title={item.last_error}>
            {item.last_error}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(item.status)}>
          {SCHEDULE_STATUS_LABELS[item.status] ?? item.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground hidden sm:table-cell">
        {item.next_run_at ? formatDate(item.next_run_at) : 'Tidak ada'}
      </TableCell>
      <TableCell className="text-muted-foreground hidden lg:table-cell">
        <div>{recurrenceLabel(item.recurrence)}</div>
        {item.timezone && <div className="text-xs">{item.timezone}</div>}
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
        <div>
          {item.occurrence_count}
          {item.occurrence_limit ? `/${item.occurrence_limit}` : ''}
        </div>
        {/* Attempts only earn a slot once a run has actually failed. */}
        {item.attempts > 0 && <div className="text-xs">{item.attempts} percobaan</div>}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          {item.status === 'paused' && (
            <IconAction
              icon={Play}
              label="Lanjutkan"
              disabled={busy}
              onClick={() => run('resume', item)}
            />
          )}
          {item.status === 'active' && (
            <IconAction
              icon={Pause}
              label="Jeda"
              disabled={busy}
              onClick={() => run('pause', item)}
            />
          )}
          {canCancel && (
            <IconAction
              icon={XCircle}
              label="Batalkan"
              variant="destructive"
              disabled={busy}
              onClick={() => run('cancel', item)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function ScheduleTable({ device }: { device: string }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ScheduleStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [offset, setOffset] = useState(0)
  const [confirmCancel, setConfirmCancel] = useState<ScheduledSend | null>(null)
  const query = usePrivateQuery({
    queryKey: ['schedules', device, status, search, messageType, offset],
    queryFn: () =>
      listSchedules({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        message_type: messageType === 'all' ? undefined : messageType,
        limit: PAGE_SIZE,
        offset,
      }),
    enabled: Boolean(device),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  })
  // Prefix key: an action changes the row's status, so every filtered view is stale.
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['schedules', device] })

  const pause = useActionMutation(pauseSchedule, { successMessage: 'Jadwal dijeda' })
  const resume = useActionMutation(resumeSchedule, { successMessage: 'Jadwal dilanjutkan' })
  const cancel = useActionMutation(cancelSchedule, { successMessage: 'Jadwal dibatalkan' })

  // The three mutations live here rather than per row, so the hook count stays
  // flat as the page fills. Rows read back the id in flight to disable only
  // themselves instead of the whole table.
  const pendingId = pause.isPending
    ? pause.variables
    : resume.isPending
      ? resume.variables
      : cancel.isPending
        ? cancel.variables
        : undefined

  // Refresh on failure too: a 400 means the row moved on, so re-sync it.
  const options = { onSettled: refresh }
  const run = (action: ScheduleAction, item: ScheduledSend) => {
    if (action === 'pause') pause.mutate(item.id, options)
    else if (action === 'resume') resume.mutate(item.id, options)
    else setConfirmCancel(item)
  }

  const rows = query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pesan terjadwal"
        description="Pengiriman WhatsApp tertunda dan berulang untuk perangkat yang dipilih."
        actions={
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={status}
            onValueChange={(value) => {
              if (!value) return
              setStatus(value as ScheduleStatus | 'all')
              setOffset(0)
            }}
          >
            {SCHEDULE_STATUS_FILTERS.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
          <Input
            className="pl-8"
            aria-label="Cari penerima atau pesan"
            placeholder="Cari penerima atau pesan"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOffset(0)
            }}
          />
        </div>
        <Select
          value={messageType}
          onValueChange={(value) => {
            setMessageType(value)
            setOffset(0)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Jenis pesan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua jenis</SelectItem>
            {SCHEDULE_MESSAGE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {query.error && (
        <Card className="border-destructive/50">
          <CardContent className="text-destructive py-4 text-sm">
            Gagal memuat jadwal: {toApiError(query.error).message}
          </CardContent>
        </Card>
      )}
      {query.isLoading && (
        <div className="flex flex-col gap-2 rounded-lg border p-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
      )}
      {query.data && rows.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Belum ada jadwal"
          hint={
            status === 'all' && messageType === 'all' && !search
              ? 'Aktifkan “Jadwalkan atau ulangi” di formulir Messaging untuk membuatnya.'
              : 'Tidak ada yang cocok dengan filter ini. Longgarkan pencarian, status, atau jenis.'
          }
        />
      )}
      {rows.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penerima</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Kirim berikutnya</TableHead>
                <TableHead className="hidden lg:table-cell">Ulangi</TableHead>
                <TableHead className="hidden md:table-cell">Terkirim</TableHead>
                <TableHead className="sr-only">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <ScheduleRow key={item.id} item={item} busy={pendingId === item.id} run={run} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* offset > 0 keeps a way back from a page emptied by cancellations. */}
      {(total > PAGE_SIZE || offset > 0) && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {offset + 1}–{offset + rows.length} dari {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft data-icon="inline-start" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Berikutnya
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
      <AlertDialog
        open={confirmCancel !== null}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan jadwal ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCancel
                ? `${messageTypeLabel(confirmCancel.message_type)} ke ${confirmCancel.phone}`
                : ''}
              {confirmCancel?.summary ? ` — “${confirmCancel.summary}”` : ''}. Pengiriman berikutnya
              tidak akan dijalankan dan jadwal yang dibatalkan tidak bisa dilanjutkan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (confirmCancel) cancel.mutate(confirmCancel.id, options)
                setConfirmCancel(null)
              }}
            >
              Batalkan jadwal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ScheduledPage() {
  const device = useSelectedDevice()
  if (!device) {
    return (
      <>
        <PageHeader
          title="Pesan terjadwal"
          description="Pengiriman WhatsApp tertunda dan berulang untuk perangkat yang dipilih."
        />
        <DeviceGuard />
      </>
    )
  }
  // Remount on device switch so the filter and page reset with the data.
  return <ScheduleTable key={device} device={device} />
}
