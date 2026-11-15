import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PaneSection } from '@/components/layout/list-detail'
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
import { Button } from '@/components/ui/button'
import { useDraftStore } from '@/features/chat/drafts'
import {
  LOCAL_DATA_ACTIONS,
  LOCAL_DATA_ENTRIES,
  localDataEntry,
  removeStorageKey,
  type LocalDataAction,
} from '@/features/settings/settings-sections'

function browserStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return window[kind]
  } catch {
    return null
  }
}

function clearLocalData(action: LocalDataAction): boolean {
  const entry = localDataEntry(action)
  // Drafts also live in the zustand store; empty it first so the persist
  // middleware cannot write the old drafts back.
  if (action === 'drafts') useDraftStore.setState({ drafts: {} })
  return removeStorageKey(browserStorage(entry.storage), entry.key)
}

export function LocalDataSection() {
  const [pending, setPending] = useState<LocalDataAction | null>(null)
  const copy = pending ? LOCAL_DATA_ACTIONS[pending] : null

  const confirm = () => {
    if (!pending) return
    if (clearLocalData(pending)) toast.success(LOCAL_DATA_ACTIONS[pending].done)
    else toast.error('Penyimpanan browser tidak dapat diakses.')
    setPending(null)
  }

  return (
    <>
      <PaneSection
        title="Yang disimpan di browser ini"
        description="Data berikut hanya tersimpan di browser ini, bukan di server GOWA. Isinya tidak ditampilkan di sini."
      >
        <ul className="divide-y">
          {LOCAL_DATA_ENTRIES.map((entry) => (
            <li key={entry.key} className="flex flex-col gap-0.5 py-2.5">
              <span className="text-sm font-medium">{entry.label}</span>
              <span className="text-muted-foreground text-sm">{entry.description}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {entry.storage} · {entry.key}
              </span>
            </li>
          ))}
        </ul>
      </PaneSection>

      <PaneSection
        title="Bersihkan data"
        description='Kredensial server hanya dihapus lewat "Putuskan koneksi" di bagian Koneksi.'
      >
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LOCAL_DATA_ACTIONS) as LocalDataAction[]).map((action) => (
            <Button key={action} variant="outline" onClick={() => setPending(action)}>
              <Trash2 className="size-4" />
              {LOCAL_DATA_ACTIONS[action].button}
            </Button>
          ))}
        </div>
      </PaneSection>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
