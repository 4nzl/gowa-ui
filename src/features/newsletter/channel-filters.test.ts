import { describe, expect, it } from 'vitest'
import type { NewsletterMetadata } from '@/api/newsletter'
import {
  channelName,
  directoryParams,
  filterChannels,
  followerLabel,
  inviteLink,
  lookupParams,
  parseCountryCodes,
  roleLabel,
} from '@/features/newsletter/channel-filters'

function channel(
  id: string,
  name = '',
  extra: Partial<NewsletterMetadata['thread_metadata']> = {},
) {
  return {
    id,
    state: { type: 'active' },
    thread_metadata: {
      creation_time: '0',
      invite: '',
      name: { text: name, id: '' },
      description: { text: '', id: '' },
      subscribers_count: '0',
      verification: '',
      ...extra,
    },
    viewer_metadata: null,
  } satisfies NewsletterMetadata
}

describe('parseCountryCodes', () => {
  it('normalises separators and case', () => {
    expect(parseCountryCodes(' id, br  sg ,')).toBe('ID,BR,SG')
    expect(parseCountryCodes('')).toBe('')
  })
})

describe('directoryParams', () => {
  it('searches by name and ignores browse filters', () => {
    expect(
      directoryParams({ search: ' news ', view: 'NEW', countries: 'ID', category: 'any' }),
    ).toEqual({ search_text: 'news', categories: undefined })
  })

  it('browses a list by country and category', () => {
    expect(
      directoryParams({ search: '', view: 'POPULAR', countries: 'id br', category: 'SPORTS' }),
    ).toEqual({ view: 'POPULAR', country_codes: 'ID,BR', categories: 'SPORTS' })
  })
})

describe('lookupParams', () => {
  it('treats numeric ids as newsletter JIDs', () => {
    expect(lookupParams('120363024512399999')).toEqual({
      newsletter_id: '120363024512399999@newsletter',
    })
    expect(lookupParams(' 120363024512399999@newsletter ')).toEqual({
      newsletter_id: '120363024512399999@newsletter',
    })
  })

  it('sends anything else as an invite', () => {
    expect(lookupParams('https://whatsapp.com/channel/0029Va')).toEqual({
      invite: 'https://whatsapp.com/channel/0029Va',
    })
  })
})

describe('channel helpers', () => {
  const channels = [channel('111@newsletter', 'Berita Pagi'), channel('222@newsletter')]

  it('names unnamed channels by their numeric id', () => {
    expect(channelName(channels[1])).toBe('222')
  })

  it('filters by name or id, case-insensitively', () => {
    expect(filterChannels(channels, 'berita').map((item) => item.id)).toEqual(['111@newsletter'])
    expect(filterChannels(channels, '222').map((item) => item.id)).toEqual(['222@newsletter'])
    expect(filterChannels(channels, '  ')).toHaveLength(2)
  })

  it('labels followers, roles and invites', () => {
    expect(followerLabel(channels[0])).toBeNull()
    expect(followerLabel(channel('3@newsletter', '', { subscribers_count: '1500' }))).toMatch(
      /pengikut$/,
    )
    expect(roleLabel('OWNER')).toBe('Pemilik')
    expect(roleLabel('unknown')).toBe('unknown')
    expect(roleLabel(undefined)).toBeNull()
    expect(inviteLink(channels[0])).toBeNull()
    expect(inviteLink(channel('4@newsletter', '', { invite: 'abc' }))).toBe(
      'https://whatsapp.com/channel/abc',
    )
  })
})
