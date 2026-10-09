// Food search by name: Turkish-insensitive, tolerant of suffixes ("tavuklu pilav" finds "tavuk … pilavı").
import { allFoods, type Food } from './foods'

export const foldTr = (s: string): string =>
  s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '')

// Common suffixes, longest first (after folding: ı→i, ü→u, ö→o, ş→s, ç→c, ğ→g).
const SUFFIXES = ['lari', 'leri', 'li', 'lu', 'si', 'su', 'ler', 'lar', 'i', 'u', 'e', 'a']

/** The word and its stems, e.g. "tavuklu" → ["tavuklu", "tavuk"]. Stems stay at least 3 letters. */
export function stems(word: string): string[] {
  const out = [word]
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 3) out.push(word.slice(0, -suf.length))
  }
  return out
}

/** Foods matching every word of the query, best first: whole-word name hits, built-in dishes, then the rest. */
export function searchFoods(query: string, limit = 30, foods: Food[] = allFoods()): Food[] {
  const words = foldTr(query.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const scored: { f: Food; score: number }[] = []
  for (const f of foods) {
    const name = foldTr(f.name)
    const hay = `${name} ${foldTr(f.brand ?? '')} ${foldTr(f.portion)}`
    let score = 0
    let ok = true
    for (const w of words) {
      const hit = stems(w).find((s) => hay.includes(s))
      if (!hit) { ok = false; break }
      score += hit === w ? 2 : 1
      if (name.includes(hit)) score += 1
      if (name.startsWith(hit)) score += 1
    }
    if (!ok) continue
    if (!f.brand) score += 1.5 // generic dishes before chain/packaged items
    if (f.id.startsWith('ev-')) score += 2 // the user's own dishes first
    scored.push({ f, score: score - name.length / 200 })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.f)
}
