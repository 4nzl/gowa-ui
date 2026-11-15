import { useState, type ReactNode } from 'react'
import { Eye, Link, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateGroupForm } from '@/features/group/create-group-form'
import { InfoFromLinkForm } from '@/features/group/info-from-link-form'
import { JoinWithLinkForm } from '@/features/group/join-with-link-form'

type ActionDialog = 'create' | 'join' | 'preview' | null

function ActionDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

/** List-pane header actions: refresh, plus a menu for create / join / preview. */
export function GroupActions({
  deviceId,
  refreshing,
  onRefresh,
  onOpenGroup,
}: {
  deviceId: string
  refreshing: boolean
  onRefresh: () => void
  /** Select a group by JID after it was created or joined. */
  onOpenGroup: (groupJid: string) => void
}) {
  const [dialog, setDialog] = useState<ActionDialog>(null)
  const [joinLink, setJoinLink] = useState('')
  const close = (open: boolean) => !open && setDialog(null)
  const openGroup = (groupJid: string) => {
    setDialog(null)
    onOpenGroup(groupJid)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        aria-label="Muat ulang daftar grup"
        disabled={refreshing}
        onClick={onRefresh}
      >
        <RefreshCw className={refreshing ? 'size-5 animate-spin' : 'size-5'} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-full"
            aria-label="Grup baru"
          >
            <Plus className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog('create')}>
            <Plus className="size-4" /> Buat grup
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setJoinLink('')
              setDialog('join')
            }}
          >
            <Link className="size-4" /> Gabung lewat tautan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog('preview')}>
            <Eye className="size-4" /> Pratinjau tautan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionDialogShell
        open={dialog === 'create'}
        onOpenChange={close}
        title="Buat grup"
        description="Mulai grup baru dengan perangkat ini sebagai admin."
      >
        <CreateGroupForm deviceId={deviceId} onCreated={openGroup} />
      </ActionDialogShell>
      <ActionDialogShell
        open={dialog === 'join'}
        onOpenChange={close}
        title="Gabung lewat tautan"
        description="Bergabung ke grup memakai tautan undangan."
      >
        <JoinWithLinkForm
          key={joinLink}
          deviceId={deviceId}
          initialLink={joinLink}
          onJoined={openGroup}
        />
      </ActionDialogShell>
      <ActionDialogShell
        open={dialog === 'preview'}
        onOpenChange={close}
        title="Pratinjau tautan"
        description="Lihat info grup dari tautan undangan sebelum bergabung."
      >
        <InfoFromLinkForm
          onJoin={(link) => {
            setJoinLink(link)
            setDialog('join')
          }}
        />
      </ActionDialogShell>
    </>
  )
}
