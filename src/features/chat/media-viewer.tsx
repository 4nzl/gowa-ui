import { Download, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

export interface ViewerMedia {
  kind: 'image' | 'video'
  src: string
  filename: string
  caption?: string
}

/**
 * Floating viewer for a message's original image or video, on the same page.
 * The file is the one GOWA already downloaded, so opening it costs no new download.
 */
export function MediaViewer({
  media,
  onOpenChange,
}: {
  media: ViewerMedia | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={media !== null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="tab:h-[min(92dvh,960px)] tab:w-[min(94vw,1280px)] tab:rounded-xl bg-background text-foreground ring-border flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 ring-1 sm:max-w-none"
      >
        {media && (
          <>
            <div className="bg-card flex shrink-0 items-center gap-2 border-b px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-sm font-medium">
                  {media.filename || (media.kind === 'image' ? 'Foto' : 'Video')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {media.kind === 'image' ? 'Pratinjau foto asli' : 'Pemutar video asli'}
                </DialogDescription>
              </div>
              <Button asChild variant="ghost" size="icon" className="size-10 rounded-full">
                <a href={media.src} download={media.filename || true} aria-label="Unduh berkas">
                  <Download className="size-5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon" className="size-10 rounded-full">
                <a href={media.src} target="_blank" rel="noreferrer" aria-label="Buka di tab baru">
                  <ExternalLink className="size-5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full"
                aria-label="Tutup"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-6" />
              </Button>
            </div>
            <div className="chat-wallpaper relative min-h-0 flex-1">
              <div className="tab:inset-4 absolute inset-2">
                {media.kind === 'image' ? (
                  <img
                    src={media.src}
                    alt={media.caption || media.filename || 'Foto'}
                    className="absolute inset-0 m-auto max-h-full max-w-full rounded-lg object-contain shadow-md"
                  />
                ) : (
                  <video
                    src={media.src}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 m-auto max-h-full max-w-full rounded-lg bg-black shadow-md"
                  />
                )}
              </div>
            </div>
            {media.caption && (
              <p className="bg-card max-h-[20dvh] shrink-0 overflow-y-auto border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm whitespace-pre-wrap">
                {media.caption}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
