/**
 * Sayıdan sonra gelen 3. tekil iyelik eki (01 E-01-04/06: "79 görevin 39’u bitti", "Açık
 * görevlerin %38’i"). Ek, sayının Türkçe okunuşunun son sözcüğüne göre ünlü uyumuyla seçilir:
 * ünsüzle bitende -ı/-i/-u/-ü, ünlüyle bitende -sı/-si/-su/-sü. Kesme işareti tasarım metnindeki
 * gibi `’` (U+2019).
 */

/** Son sözcükler: birler (1–9), onlar (10–90), sonra basamak adları. */
const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
const SCALES: ReadonlyArray<[number, string]> = [
  [1_000_000_000, 'milyar'],
  [1_000_000, 'milyon'],
  [1_000, 'bin'],
  [100, 'yüz'],
]

/** Sayının okunuşundaki son sözcük (negatif sayıda mutlak değer; kesir yok sayılır). */
export function lastSpokenWord(value: number): string {
  const n = Math.floor(Math.abs(value))
  if (n === 0) return 'sıfır'
  if (n % 10 !== 0) return ONES[n % 10]!
  if (n % 100 !== 0) return TENS[(n % 100) / 10]!
  for (const [unit, word] of SCALES) {
    if (n % unit === 0) return word
  }
  return 'yüz'
}

const BACK_VOWELS = new Set(['a', 'ı', 'o', 'u'])
const ROUNDED = new Set(['o', 'u', 'ö', 'ü'])
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'])

/** Dört yönlü ünlü uyumu: son ünlüye göre ı / i / u / ü. */
function harmonyVowel(word: string): string {
  const last = [...word].reverse().find((ch) => VOWELS.has(ch)) ?? 'i'
  const back = BACK_VOWELS.has(last)
  if (ROUNDED.has(last)) return back ? 'u' : 'ü'
  return back ? 'ı' : 'i'
}

/** "’i", "’u", "’si", "’sı" … — sayıya eklenecek iyelik eki. */
export function possessiveSuffix(value: number): string {
  const word = lastSpokenWord(value)
  const vowel = harmonyVowel(word)
  const endsWithVowel = VOWELS.has(word.at(-1) ?? '')
  return `’${endsWithVowel ? 's' : ''}${vowel}`
}
