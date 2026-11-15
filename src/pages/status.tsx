import { CircleDashed, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export default function StatusPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Status"
        description="Bagikan foto, video, dan teks yang hilang setelah 24 jam."
      />

      <div className="bg-card flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
        <CircleDashed className="text-muted-foreground size-10" strokeWidth={1.5} />
        <h2 className="text-lg font-medium">Tampilan Status sedang disiapkan</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          GOWA belum memiliki endpoint khusus Status. Pembaruan Status dapat dikirim lewat Messaging
          dengan tipe penerima <strong className="text-foreground">Status</strong>{' '}
          (status@broadcast). Melihat Status kontak akan diaktifkan setelah dukungannya
          terverifikasi di server.
        </p>
        <Button asChild>
          <Link to="/messaging">
            <Send className="size-4" />
            Buka Messaging
          </Link>
        </Button>
      </div>
    </div>
  )
}
