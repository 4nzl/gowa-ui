/** Bundled emoji set (no remote dataset). Keywords are Indonesian and English for search. */
export interface EmojiCategory {
  id: string
  label: string
  icon: string
  emojis: readonly (readonly [emoji: string, keywords: string])[]
}

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smiley & orang',
    icon: '😀',
    emojis: [
      ['😀', 'senyum lebar grin smile'],
      ['😃', 'senyum gembira happy'],
      ['😄', 'senyum tertawa smile laugh'],
      ['😁', 'nyengir grin'],
      ['😆', 'tertawa ngakak laugh'],
      ['😅', 'keringat lega sweat'],
      ['🤣', 'ngakak guling rofl'],
      ['😂', 'tertawa menangis joy lol'],
      ['🙂', 'senyum tipis slight smile'],
      ['🙃', 'terbalik upside'],
      ['😉', 'kedip wink'],
      ['😊', 'malu senyum blush'],
      ['😇', 'malaikat innocent angel'],
      ['🥰', 'sayang cinta love hearts'],
      ['😍', 'jatuh cinta heart eyes'],
      ['🤩', 'kagum star struck'],
      ['😘', 'cium kiss'],
      ['😋', 'lezat enak yum'],
      ['😜', 'melet canda wink tongue'],
      ['🤪', 'gila konyol zany'],
      ['🤗', 'peluk hug'],
      ['🤭', 'tutup mulut oops'],
      ['🤫', 'diam rahasia shush'],
      ['🤔', 'berpikir hmm thinking'],
      ['🫡', 'hormat salute siap'],
      ['🤐', 'tutup mulut zipper'],
      ['😐', 'datar netral neutral'],
      ['😑', 'tanpa ekspresi expressionless'],
      ['😶', 'tanpa mulut speechless'],
      ['😏', 'menyeringai smirk'],
      ['😒', 'bosan kesal unamused'],
      ['🙄', 'memutar mata eye roll'],
      ['😬', 'meringis grimace'],
      ['😌', 'lega relieved'],
      ['😔', 'sedih murung pensive'],
      ['😪', 'ngantuk sleepy'],
      ['😴', 'tidur sleeping'],
      ['😷', 'masker sakit mask sick'],
      ['🤒', 'demam sakit fever'],
      ['🤧', 'bersin flu sneeze'],
      ['🥵', 'panas gerah hot'],
      ['🥶', 'dingin cold'],
      ['😵', 'pusing dizzy'],
      ['🤯', 'meledak kaget mind blown'],
      ['🥳', 'pesta rayakan party'],
      ['😎', 'keren kacamata cool'],
      ['🤓', 'kutu buku nerd'],
      ['😕', 'bingung confused'],
      ['😟', 'khawatir worried'],
      ['😮', 'terkejut wow surprised'],
      ['😲', 'kaget astonished'],
      ['🥺', 'memohon please puppy'],
      ['😢', 'menangis sedih cry'],
      ['😭', 'menangis keras sob'],
      ['😱', 'takut teriak scream'],
      ['😖', 'frustrasi confounded'],
      ['😞', 'kecewa disappointed'],
      ['😓', 'keringat dingin downcast'],
      ['😩', 'lelah weary'],
      ['😫', 'capek tired'],
      ['🥱', 'menguap yawn'],
      ['😤', 'kesal triumph huff'],
      ['😡', 'marah angry'],
      ['🤬', 'mengumpat cursing'],
      ['🤡', 'badut clown'],
      ['💩', 'kotoran poop'],
    ],
  },
  {
    id: 'gestures',
    label: 'Gestur',
    icon: '👍',
    emojis: [
      ['👍', 'jempol setuju oke like thumbs up'],
      ['👎', 'jempol bawah tidak dislike'],
      ['👌', 'oke sip ok'],
      ['✌️', 'damai victory peace'],
      ['🤞', 'semoga beruntung fingers crossed'],
      ['🤟', 'love you'],
      ['🤙', 'telepon call me shaka'],
      ['👋', 'halo dadah wave hello'],
      ['🤚', 'tangan raised back'],
      ['✋', 'tangan stop high five'],
      ['👏', 'tepuk tangan clap'],
      ['🙌', 'hore raise hands'],
      ['👐', 'tangan terbuka open hands'],
      ['🤲', 'berdoa palms up'],
      ['🙏', 'terima kasih mohon doa please thanks pray'],
      ['🤝', 'salaman sepakat handshake deal'],
      ['💪', 'kuat semangat strong muscle'],
      ['👉', 'tunjuk kanan point right'],
      ['👈', 'tunjuk kiri point left'],
      ['👆', 'tunjuk atas point up'],
      ['👇', 'tunjuk bawah point down'],
      ['☝️', 'satu index up'],
      ['✍️', 'menulis writing'],
      ['👀', 'mata lihat eyes look'],
      ['🫶', 'hati tangan heart hands'],
    ],
  },
  {
    id: 'hearts',
    label: 'Hati & simbol',
    icon: '❤️',
    emojis: [
      ['❤️', 'hati merah cinta love heart red'],
      ['🧡', 'hati oranye orange heart'],
      ['💛', 'hati kuning yellow heart'],
      ['💚', 'hati hijau green heart'],
      ['💙', 'hati biru blue heart'],
      ['💜', 'hati ungu purple heart'],
      ['🖤', 'hati hitam black heart'],
      ['🤍', 'hati putih white heart'],
      ['💔', 'patah hati broken heart'],
      ['💕', 'dua hati two hearts'],
      ['💖', 'hati berkilau sparkling heart'],
      ['💯', 'seratus sempurna hundred'],
      ['✅', 'centang selesai lunas check done'],
      ['☑️', 'kotak centang ballot check'],
      ['✔️', 'centang check mark'],
      ['❌', 'silang salah batal cross no'],
      ['⚠️', 'peringatan warning'],
      ['❗', 'seru penting exclamation'],
      ['❓', 'tanya question'],
      ['‼️', 'seru ganda double exclamation'],
      ['🔴', 'merah lingkaran red circle'],
      ['🟢', 'hijau lingkaran green circle'],
      ['🟡', 'kuning lingkaran yellow circle'],
      ['⭐', 'bintang star'],
      ['✨', 'kilau sparkles'],
      ['🔥', 'api mantap fire hot'],
      ['💥', 'ledakan boom'],
      ['🎉', 'perayaan selamat party popper'],
      ['🎊', 'konfeti confetti'],
      ['🆗', 'oke ok button'],
      ['🆕', 'baru new'],
      ['➡️', 'panah kanan arrow right'],
      ['⬅️', 'panah kiri arrow left'],
      ['🔁', 'ulang repeat'],
    ],
  },
  {
    id: 'nature',
    label: 'Alam & cuaca',
    icon: '🌿',
    emojis: [
      ['☀️', 'matahari cerah sun'],
      ['🌤️', 'cerah berawan sun cloud'],
      ['⛅', 'berawan cloudy'],
      ['🌧️', 'hujan rain'],
      ['⛈️', 'badai storm'],
      ['🌈', 'pelangi rainbow'],
      ['🌙', 'bulan malam moon'],
      ['🌊', 'ombak laut wave sea'],
      ['🌴', 'pohon kelapa palm'],
      ['🌳', 'pohon tree'],
      ['🌸', 'bunga sakura blossom'],
      ['🌹', 'mawar rose'],
      ['🌻', 'bunga matahari sunflower'],
      ['🍀', 'semanggi beruntung clover'],
      ['🐱', 'kucing cat'],
      ['🐶', 'anjing dog'],
      ['🐔', 'ayam chicken'],
      ['🐟', 'ikan fish'],
      ['🦋', 'kupu kupu butterfly'],
    ],
  },
  {
    id: 'food',
    label: 'Makanan',
    icon: '🍔',
    emojis: [
      ['☕', 'kopi coffee'],
      ['🍵', 'teh tea'],
      ['🥤', 'minuman es drink'],
      ['🍚', 'nasi rice'],
      ['🍛', 'kari nasi curry'],
      ['🍜', 'mie bakso noodle'],
      ['🍗', 'ayam goreng chicken leg'],
      ['🍖', 'daging meat'],
      ['🍔', 'burger'],
      ['🍕', 'pizza'],
      ['🍞', 'roti bread'],
      ['🍰', 'kue cake'],
      ['🎂', 'kue ulang tahun birthday cake'],
      ['🍩', 'donat donut'],
      ['🍎', 'apel apple'],
      ['🍌', 'pisang banana'],
      ['🍉', 'semangka watermelon'],
      ['🥭', 'mangga mango'],
      ['🍽️', 'makan piring dinner'],
    ],
  },
  {
    id: 'travel',
    label: 'Perjalanan',
    icon: '✈️',
    emojis: [
      ['✈️', 'pesawat terbang tiket flight plane'],
      ['🛫', 'berangkat departure'],
      ['🛬', 'tiba arrival'],
      ['🧳', 'koper bagasi luggage'],
      ['🏨', 'hotel'],
      ['🏝️', 'pulau liburan island holiday'],
      ['🏖️', 'pantai beach'],
      ['🗺️', 'peta map'],
      ['📍', 'lokasi pin location'],
      ['🚗', 'mobil car'],
      ['🚕', 'taksi taxi'],
      ['🚌', 'bus'],
      ['🚆', 'kereta train'],
      ['🚢', 'kapal ship'],
      ['⛽', 'bensin fuel'],
      ['🕌', 'masjid mosque'],
      ['⛪', 'gereja church'],
      ['🏠', 'rumah home'],
      ['🏢', 'kantor gedung office'],
    ],
  },
  {
    id: 'objects',
    label: 'Benda & kerja',
    icon: '💼',
    emojis: [
      ['📱', 'ponsel hp phone'],
      ['💻', 'laptop'],
      ['📞', 'telepon phone call'],
      ['📧', 'email'],
      ['📎', 'lampiran klip attachment'],
      ['📄', 'dokumen document'],
      ['📋', 'clipboard daftar pesanan'],
      ['🧾', 'kuitansi struk nota receipt'],
      ['📅', 'kalender tanggal calendar'],
      ['⏰', 'alarm jam'],
      ['⏳', 'menunggu jam pasir hourglass'],
      ['💰', 'uang kantong money bag'],
      ['💵', 'uang dolar cash'],
      ['💳', 'kartu kredit card'],
      ['🏦', 'bank'],
      ['📈', 'naik grafik chart up'],
      ['📉', 'turun grafik chart down'],
      ['🔒', 'kunci lock'],
      ['🔑', 'kunci key'],
      ['💡', 'ide lampu idea'],
      ['🎁', 'hadiah gift'],
      ['🛒', 'belanja keranjang cart'],
      ['📦', 'paket box package'],
      ['🚀', 'roket rocket'],
      ['💼', 'tas kerja briefcase'],
    ],
  },
]

export const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((category) => category.emojis)

/** Every search word must appear in the keywords (prefix match on each keyword). */
export function searchEmojis(query: string): string[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return ALL_EMOJIS.filter(([, keywords]) => {
    const tokens = keywords.split(' ')
    return words.every((word) => tokens.some((token) => token.startsWith(word)))
  }).map(([emoji]) => emoji)
}

/** Inserts `text` at the textarea selection and returns the new value and caret. */
export function insertAtCursor(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  text: string,
): { value: string; caret: number } {
  const start = selectionStart ?? value.length
  const end = selectionEnd ?? start
  return { value: value.slice(0, start) + text + value.slice(end), caret: start + text.length }
}

const RECENT_KEY = 'gowa-ui.emoji-recent.v1'
const RECENT_LIMIT = 24

export function readRecentEmojis(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function pushRecentEmoji(emoji: string): string[] {
  const next = [emoji, ...readRecentEmojis().filter((item) => item !== emoji)].slice(
    0,
    RECENT_LIMIT,
  )
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Recents are a convenience only.
  }
  return next
}
