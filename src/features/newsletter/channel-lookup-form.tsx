import { useState, type FormEvent } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { getNewsletterInfo, type NewsletterMetadata } from '@/api/newsletter'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { lookupParams } from '@/features/newsletter/channel-filters'

/**
 * Header action: fetch a channel by ID or invite link without following it,
 * then open it in the detail pane.
 */
export function ChannelLookupDialog({
  onFound,
}: {
  onFound: (channel: NewsletterMetadata) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const lookup = useActionMutation(getNewsletterInfo, {
    successMessage: 'Saluran ditemukan',
    onSuccess: (channel) => {
      onFound(channel)
      setOpen(false)
      setValue('')
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    lookup.mutate(lookupParams(value))
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-full"
            aria-label="Buka saluran dari ID atau tautan undangan"
            onClick={() => setOpen(true)}
          >
            <Link2 className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Buka dari ID atau tautan</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>Buka saluran</DialogTitle>
              <DialogDescription>
                Ambil detail saluran dari ID atau tautan undangan tanpa mengikutinya.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="channel-lookup">ID saluran atau tautan undangan</Label>
              <Input
                id="channel-lookup"
                placeholder="120363024512399999@newsletter atau https://whatsapp.com/channel/…"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={lookup.isPending || !value.trim()}>
                {lookup.isPending && <Loader2 className="size-4 animate-spin" />}
                Cari
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
