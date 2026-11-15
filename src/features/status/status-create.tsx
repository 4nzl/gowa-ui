import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Info, Loader2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { sendImage, sendText, sendVideo } from '@/api/send'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { attachmentError, attachmentKind, maxBytesFor } from '@/features/composer/attachment'
import {
  STATUS_JID,
  STATUS_KIND_LABELS,
  draftProblem,
  type StatusKind,
} from '@/features/status/status-format'
import { statusQueryKey } from '@/features/status/use-statuses'
import { useAppInfo } from '@/hooks/use-app-info'
import { toApiError } from '@/lib/api-error'
import { formatBytes } from '@/lib/format'
import { useConnection } from '@/stores/connection'

interface PublishInput {
  kind: StatusKind
  text: string
  file: File | null
  allowReshare: boolean
}

function publish(input: PublishInput, deviceId: string) {
  const allow_reshare = input.allowReshare || undefined
  if (input.kind === 'text') {
    return sendText({ phone: STATUS_JID, message: input.text, allow_reshare }, deviceId)
  }
  const payload = {
    phone: STATUS_JID,
    file: input.file ?? undefined,
    caption: input.text.trim() || undefined,
    allow_reshare,
  }
  return input.kind === 'image' ? sendImage(payload, deviceId) : sendVideo(payload, deviceId)
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

export function StatusCreate({ deviceId, onBack }: { deviceId: string; onBack: () => void }) {
  const queryClient = useQueryClient()
  const connectionId = useConnection((state) => state.connectionId)
  const info = useAppInfo().data
  const [kind, setKind] = useState<StatusKind>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [allowReshare, setAllowReshare] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  const preview = useObjectUrl(file)

  const mutation = useMutation({
    mutationFn: (input: PublishInput) => publish(input, deviceId),
    onSuccess: () => {
      toast.success('Status dipublikasikan')
      setConfirmOpen(false)
      setText('')
      setFile(null)
      setAllowReshare(false)
      void queryClient.invalidateQueries({
        queryKey: statusQueryKey(deviceId, 'latest', connectionId),
      })
    },
    onError: (error) => {
      setConfirmOpen(false)
      toast.error(`Gagal mempublikasikan: ${toApiError(error).message}`)
    },
  })
  const pending = mutation.isPending

  const changeKind = (value: string) => {
    if (pending) return
    setKind(value as StatusKind)
    setFile(null)
    setFileError(null)
  }

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!picked) return
    const pickedKind = attachmentKind(picked, 'media')
    if (pickedKind !== kind) {
      setFile(null)
      setFileError(
        `Berkas ini bukan ${kind === 'image' ? 'foto' : 'video'}. Pilih berkas ${STATUS_KIND_LABELS[kind].toLowerCase()} yang didukung.`,
      )
      return
    }
    const problem = attachmentError(picked, pickedKind, info)
    setFile(problem ? null : picked)
    setFileError(problem)
  }

  const problem = fileError ?? draftProblem(kind, text, file)
  const limit = kind === 'text' ? null : maxBytesFor(kind, info)
  const submit = () => {
    if (pending || draftProblem(kind, text, file)) return
    mutation.mutate({ kind, text, file, allowReshare })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        title="Status saya"
        subtitle="Buat status baru lewat perangkat aktif"
      />
      <DetailPaneBody>
        <PaneSection title="Status baru" description="Pilih jenis status, isi, lalu publikasikan.">
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!problem && !pending) setConfirmOpen(true)
            }}
          >
            <Tabs value={kind} onValueChange={changeKind}>
              <TabsList>
                {(Object.keys(STATUS_KIND_LABELS) as StatusKind[]).map((value) => (
                  <TabsTrigger key={value} value={value} disabled={pending}>
                    {STATUS_KIND_LABELS[value]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {kind !== 'text' && (
              <div className="flex flex-col gap-2">
                <Label>{STATUS_KIND_LABELS[kind]}</Label>
                <input
                  ref={picker}
                  type="file"
                  accept={kind === 'image' ? 'image/*' : 'video/*'}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={onPick}
                />
                {file && preview ? (
                  <div className="bg-muted relative overflow-hidden rounded-lg border">
                    {kind === 'image' ? (
                      <img
                        src={preview}
                        alt="Pratinjau foto"
                        className="mx-auto max-h-80 object-contain"
                      />
                    ) : (
                      <video src={preview} controls className="mx-auto max-h-80 w-full" />
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 size-8 rounded-full"
                      aria-label="Hapus berkas"
                      disabled={pending}
                      onClick={() => setFile(null)}
                    >
                      <X className="size-4" />
                    </Button>
                    <p className="text-muted-foreground bg-card/90 truncate border-t px-3 py-1.5 text-xs">
                      {file.name} · {formatBytes(file.size)}
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-28 flex-col gap-1 border-dashed"
                    disabled={pending}
                    onClick={() => picker.current?.click()}
                  >
                    <ImagePlus className="size-6" />
                    Pilih {kind === 'image' ? 'foto' : 'video'}
                    {limit !== null && (
                      <span className="text-muted-foreground text-xs font-normal">
                        Maksimal {formatBytes(limit)}
                      </span>
                    )}
                  </Button>
                )}
                {fileError && (
                  <p className="text-destructive text-sm" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="status-text">{kind === 'text' ? 'Teks status' : 'Keterangan'}</Label>
              <Textarea
                id="status-text"
                value={text}
                disabled={pending}
                rows={kind === 'text' ? 5 : 2}
                placeholder={kind === 'text' ? 'Ketik status…' : 'Tambahkan keterangan (opsional)'}
                onChange={(event) => setText(event.target.value)}
              />
              {kind === 'text' && (
                <p className="text-muted-foreground text-xs">
                  GOWA belum mendukung pilihan warna latar atau huruf untuk status teks.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allowReshare}
                disabled={pending}
                onCheckedChange={(value) => setAllowReshare(value === true)}
              />
              Izinkan dibagikan ulang
            </label>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {problem && !fileError && (
                <p className="text-muted-foreground mr-auto text-xs">{problem}</p>
              )}
              <Button type="submit" disabled={Boolean(problem) || pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Publikasikan
              </Button>
            </div>
          </form>
        </PaneSection>

        <div className="text-muted-foreground flex gap-2 rounded-lg border border-dashed p-3 text-xs">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Status Anda tampil di ponsel; server GOWA tidak selalu menyimpan salinannya, jadi status
            yang dipublikasikan dari sini mungkin tidak muncul di daftar Status.
          </p>
        </div>
      </DetailPaneBody>

      <AlertDialog open={confirmOpen} onOpenChange={(next) => !pending && setConfirmOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publikasikan status?</AlertDialogTitle>
            <AlertDialogDescription>
              {STATUS_KIND_LABELS[kind]} ini akan dipublikasikan sebagai status WhatsApp dan dapat
              dilihat kontak Anda sesuai pengaturan privasi status di ponsel.
              {allowReshare && ' Kontak juga diizinkan membagikannya ulang.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <Button disabled={pending} onClick={submit}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Publikasikan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
