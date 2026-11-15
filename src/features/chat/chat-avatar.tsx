import { UserRound, Users } from 'lucide-react'
import { avatarTone, isGroupJid } from '@/features/chat/chat-format'
import { cn } from '@/lib/utils'

const TONES = [
  'bg-[#dfe4f2] text-[#48587e] dark:bg-[#2b3554] dark:text-[#c3cdf0]',
  'bg-[#f3ded1] text-[#a45c3c] dark:bg-[#4a3226] dark:text-[#f0c4ab]',
  'bg-[#f8ebca] text-[#8a6a28] dark:bg-[#4a3f1f] dark:text-[#f0d99a]',
  'bg-[#daf7d6] text-[#3f7d59] dark:bg-[#1f4430] dark:text-[#b4ebc6]',
  'bg-[#d9ebf8] text-[#3e6b9f] dark:bg-[#1f3a52] dark:text-[#b5d5f3]',
  'bg-[#e6def8] text-[#6352c1] dark:bg-[#352c58] dark:text-[#d2c7fb]',
]

/** Initial on a stable colour per chat; groups get a people icon. */
export function ChatAvatar({
  jid,
  name,
  className,
}: {
  jid: string
  name: string
  className?: string
}) {
  // Unnamed chats are titled with their number; show a person instead of a digit.
  const numeric = /^[+\d\s-]+$/.test(name.trim())
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?'
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-medium select-none',
        TONES[avatarTone(jid)],
        className,
      )}
    >
      {isGroupJid(jid) ? (
        <Users className="size-[45%]" />
      ) : numeric ? (
        <UserRound className="size-[50%]" />
      ) : (
        initial
      )}
    </span>
  )
}
