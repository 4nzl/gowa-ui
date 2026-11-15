import type {
  DirectoryParams,
  DirectoryView,
  NewsletterInfoParams,
  NewsletterMetadata,
} from '@/api/newsletter'
import { formatDay } from '@/lib/format'

export const DIRECTORY_VIEWS: { value: DirectoryView; label: string }[] = [
  { value: 'RECOMMENDED', label: 'Rekomendasi' },
  { value: 'TRENDING', label: 'Sedang tren' },
  { value: 'POPULAR', label: 'Populer' },
  { value: 'NEW', label: 'Terbaru' },
  { value: 'FEATURED', label: 'Unggulan' },
]

export const DIRECTORY_CATEGORIES: { value: string; label: string }[] = [
  { value: 'BUSINESS', label: 'Bisnis' },
  { value: 'ENTERTAINMENT', label: 'Hiburan' },
  { value: 'LIFESTYLE', label: 'Gaya hidup' },
  { value: 'NEWS', label: 'Berita' },
  { value: 'ORGANIZATIONS', label: 'Organisasi' },
  { value: 'PEOPLE', label: 'Tokoh' },
  { value: 'SPORTS', label: 'Olahraga' },
]

/** Select value meaning "no category filter". */
export const ANY_CATEGORY = 'any'

export type ChannelTab = 'following' | 'discover'

export const CHANNEL_TABS: { id: ChannelTab; label: string }[] = [
  { id: 'following', label: 'Diikuti' },
  { id: 'discover', label: 'Temukan' },
]

/** "ID, br  sg" → "ID,BR,SG" (the API takes comma-separated ISO alpha-2 codes). */
export function parseCountryCodes(input: string): string {
  return input
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((code) => code.toUpperCase())
    .join(',')
}

/** Directory request for the filter form: a name search, or a browse list by country. */
export function directoryParams(form: {
  search: string
  view: DirectoryView
  countries: string
  category: string
}): DirectoryParams {
  const categories = form.category === ANY_CATEGORY ? undefined : form.category
  const search = form.search.trim()
  if (search) return { search_text: search, categories }
  return { view: form.view, country_codes: parseCountryCodes(form.countries), categories }
}

/**
 * A bare numeric id (with or without "@newsletter") is a channel JID; anything
 * else is sent as an invite code or link.
 */
export function lookupParams(input: string): NewsletterInfoParams {
  const value = input.trim()
  if (/^\d+(@newsletter)?$/.test(value)) {
    return { newsletter_id: `${value.replace(/@newsletter$/, '')}@newsletter` }
  }
  return { invite: value }
}

export function channelName(channel: NewsletterMetadata): string {
  return channel.thread_metadata?.name?.text || channel.id.split('@')[0]
}

/** Client-side filter of the followed list by name or numeric id. */
export function filterChannels(
  channels: readonly NewsletterMetadata[],
  query: string,
): NewsletterMetadata[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...channels]
  return channels.filter(
    (channel) =>
      channelName(channel).toLowerCase().includes(needle) ||
      channel.id.toLowerCase().includes(needle),
  )
}

const countFormat = new Intl.NumberFormat('id-ID', { notation: 'compact' })

/** "12,3 rb pengikut", or null when the server did not report a count. */
export function followerLabel(channel: NewsletterMetadata): string | null {
  const count = Number(channel.thread_metadata?.subscribers_count)
  return count > 0 ? `${countFormat.format(count)} pengikut` : null
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
  subscriber: 'Pengikut',
  guest: 'Tamu',
}

export function roleLabel(role: string | undefined | null): string | null {
  if (!role) return null
  return ROLE_LABELS[role.toLowerCase()] ?? role
}

export function inviteLink(channel: NewsletterMetadata): string | null {
  const invite = channel.thread_metadata?.invite
  return invite ? `https://whatsapp.com/channel/${invite}` : null
}

/** Second line of a channel row: followers, own role and creation day. */
export function channelDetails(channel: NewsletterMetadata): string {
  const created = Number(channel.thread_metadata?.creation_time)
  return [
    followerLabel(channel),
    roleLabel(channel.viewer_metadata?.role),
    created > 0 && `Dibuat ${formatDay(new Date(created * 1000).toISOString())}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
