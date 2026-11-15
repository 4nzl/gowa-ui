import type { ComponentType } from 'react'
import {
  BarChart3,
  CheckCheck,
  FileUp,
  Forward,
  Image,
  Keyboard,
  Link2,
  MapPin,
  MessageSquareText,
  Mic,
  MousePointerClick,
  Pencil,
  PlayCircle,
  Radio,
  SmilePlus,
  Star,
  Sticker,
  Trash2,
  Undo2,
  UserRound,
  UserRoundSearch,
  Video,
} from 'lucide-react'

export type ComposeModeId =
  | 'text'
  | 'image'
  | 'video'
  | 'file'
  | 'audio'
  | 'sticker'
  | 'contact'
  | 'location'
  | 'link'
  | 'poll'
  | 'interactive'
  | 'presence'
  | 'chat-presence'
  | 'subscribe-presence'

export type ActModeId =
  'react' | 'update' | 'read' | 'played' | 'star' | 'revoke' | 'delete' | 'forward'

export type MessagingModeId = ComposeModeId | ActModeId

export type MessagingGroupId = 'send' | 'presence' | 'action'

export interface MessagingMode {
  id: MessagingModeId
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  group: MessagingGroupId
  /** The form reads the shared recipient, so the detail pane shows the RecipientBar. */
  needsRecipient: boolean
  /** Acts on an existing message, so the detail pane asks for its Message ID. */
  needsMessageId: boolean
}

const send = (
  id: ComposeModeId,
  label: string,
  description: string,
  icon: MessagingMode['icon'],
): MessagingMode => ({
  id,
  label,
  description,
  icon,
  group: 'send',
  needsRecipient: true,
  needsMessageId: false,
})

const act = (
  id: ActModeId,
  label: string,
  description: string,
  icon: MessagingMode['icon'],
): MessagingMode => ({
  id,
  label,
  description,
  icon,
  group: 'action',
  needsRecipient: true,
  needsMessageId: true,
})

export const MESSAGING_GROUPS: { id: MessagingGroupId; label: string; modes: MessagingMode[] }[] = [
  {
    id: 'send',
    label: 'Kirim pesan',
    modes: [
      send('text', 'Teks', 'Pesan teks, bisa membalas pesan lain', MessageSquareText),
      send('image', 'Gambar', 'Gambar dengan keterangan, view once, HD', Image),
      send('video', 'Video', 'Video dengan keterangan, view once, GIF', Video),
      send('file', 'Dokumen', 'Berkas apa pun sebagai dokumen', FileUp),
      send('audio', 'Audio', 'Berkas audio atau voice note (PTT)', Mic),
      send('sticker', 'Stiker', 'Gambar yang dikirim sebagai stiker', Sticker),
      send('contact', 'Kontak', 'Kartu kontak dengan nama dan nomor', UserRound),
      send('location', 'Lokasi', 'Titik latitude dan longitude', MapPin),
      send('link', 'Tautan', 'URL dengan keterangan', Link2),
      send('poll', 'Polling', 'Pertanyaan dengan beberapa opsi', BarChart3),
      send(
        'interactive',
        'Pesan interaktif',
        'Tombol, permintaan lokasi, atau carousel',
        MousePointerClick,
      ),
    ],
  },
  {
    id: 'presence',
    label: 'Kehadiran',
    modes: [
      {
        id: 'presence',
        label: 'Presence',
        description: 'Tandai perangkat tersedia atau tidak tersedia',
        icon: Radio,
        group: 'presence',
        // Device-wide: the request carries no recipient.
        needsRecipient: false,
        needsMessageId: false,
      },
      {
        id: 'chat-presence',
        label: 'Chat presence (mengetik)',
        description: 'Mulai atau hentikan indikator mengetik',
        icon: Keyboard,
        group: 'presence',
        needsRecipient: true,
        needsMessageId: false,
      },
      {
        id: 'subscribe-presence',
        label: 'Pantau kehadiran (subscribe)',
        description: 'Terima status online/offline kontak lewat webhook',
        icon: UserRoundSearch,
        group: 'presence',
        needsRecipient: true,
        needsMessageId: false,
      },
    ],
  },
  {
    id: 'action',
    label: 'Tindakan pesan',
    modes: [
      act('react', 'Reaksi', 'Beri atau hapus reaksi emoji', SmilePlus),
      act('update', 'Edit', 'Ubah teks pesan yang sudah terkirim', Pencil),
      act('read', 'Tandai dibaca', 'Kirim tanda dibaca untuk pesan', CheckCheck),
      act('played', 'Tandai diputar', 'Kirim tanda diputar untuk pesan audio', PlayCircle),
      act('star', 'Bintang', 'Beri atau lepas bintang pada pesan', Star),
      act('revoke', 'Tarik (revoke)', 'Hapus pesan untuk semua orang', Undo2),
      act('delete', 'Hapus untuk saya', 'Hapus pesan hanya dari perangkat ini', Trash2),
      act('forward', 'Teruskan', 'Teruskan pesan ke penerima, bisa dijadwalkan', Forward),
    ],
  },
]

export const MESSAGING_MODES: MessagingMode[] = MESSAGING_GROUPS.flatMap((group) => group.modes)

export const DEFAULT_MODE_ID: MessagingModeId = 'text'

export function findMode(id: string | null | undefined): MessagingMode | undefined {
  return MESSAGING_MODES.find((mode) => mode.id === id)
}
