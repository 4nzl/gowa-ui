import { useEffect, useId } from 'react'
import { History } from 'lucide-react'
import { IdText } from '@/components/shared/id-text'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { composeJid, isStatus, type RecipientType } from '@/lib/jid'
import { cn } from '@/lib/utils'
import {
  RECIPIENT_TYPE_LABELS,
  localizedRecipientOptions,
} from '@/features/messaging/recipient-labels'
import { useRecipientStore } from '@/stores/recipient'

/**
 * The shared recipient bar: entered once here, consumed by every form that
 * calls useRecipientJid(). Used by the Messaging and Account workspaces.
 */
export function RecipientBar({
  showStatus = true,
  className,
}: {
  showStatus?: boolean
  className?: string
}) {
  const recipient = useRecipientStore((state) => state.recipient)
  const recents = useRecipientStore((state) => state.recents)
  const setRecipient = useRecipientStore((state) => state.setRecipient)
  const pushRecent = useRecipientStore((state) => state.pushRecent)
  const options = localizedRecipientOptions(showStatus)
  const jid = composeJid(recipient.phone, recipient.type)
  const id = useId()

  useEffect(() => {
    if (!showStatus && isStatus(recipient.type)) {
      setRecipient({ ...recipient, type: 'user' })
    }
  }, [showStatus, recipient, setRecipient])

  return (
    <section
      aria-label="Penerima"
      className={cn('bg-card tab:p-5 flex flex-col gap-3 rounded-xl border p-4', className)}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="max-tab:w-full flex flex-col gap-2">
          <Label htmlFor={`${id}-type`}>Jenis penerima</Label>
          <Select
            value={recipient.type}
            onValueChange={(type) => setRecipient({ ...recipient, type: type as RecipientType })}
          >
            <SelectTrigger id={`${id}-type`} className="tab:w-48 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isStatus(recipient.type) && (
          <div className="flex min-w-48 flex-1 flex-col gap-2">
            <Label htmlFor="recipient-phone">Nomor / ID grup / JID</Label>
            <Input
              id="recipient-phone"
              placeholder="628xxxxxxxxxx"
              inputMode="text"
              autoComplete="off"
              value={recipient.phone}
              onChange={(event) => setRecipient({ ...recipient, phone: event.target.value })}
              onBlur={() => pushRecent(recipient)}
            />
          </div>
        )}

        {recents.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Penerima terakhir"
                title="Penerima terakhir"
              >
                <History className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-w-[min(22rem,calc(100vw-2rem))]">
              <DropdownMenuLabel>Penerima terakhir</DropdownMenuLabel>
              {recents.map((recent) => (
                <DropdownMenuItem
                  key={`${recent.type}:${recent.phone}`}
                  onClick={() => setRecipient(recent)}
                >
                  <span className="truncate font-mono text-xs">{recent.phone}</span>
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                    {RECIPIENT_TYPE_LABELS[recent.type]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {jid ? (
        <IdText value={jid} />
      ) : (
        <p className="text-muted-foreground text-xs">
          Isi nomor atau ID penerima; tombol Kirim aktif setelah JID terbentuk.
        </p>
      )}
    </section>
  )
}
