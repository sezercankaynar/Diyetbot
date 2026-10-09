// Open Food Facts: free, open product database (no API key). Network only –
// results are turned into plain label values by the engine (labelFromOff).
import { labelFromOff, type LabelInput } from '@/engine'

const BASE = 'https://world.openfoodfacts.org'
const SEARCH = 'https://search.openfoodfacts.org'
const FIELDS = 'code,product_name,product_name_tr,brands,serving_quantity,nutriments'

export type OffResult = Omit<LabelInput, 'portionG'> & { servingG?: number }

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch {
    throw new Error('İnternet bağlantısı yok ya da ürün veritabanına ulaşılamadı.')
  }
  if (res.status === 429) throw new Error('Çok sık arama yapıldı; bir dakika sonra tekrar dene.')
  if (!res.ok) throw new Error(`Ürün veritabanı hata verdi (${res.status}).`)
  return res.json()
}

export async function productByBarcode(code: string, signal?: AbortSignal): Promise<OffResult | null> {
  const clean = code.replace(/\D/g, '')
  if (!clean) return null
  const data = (await getJson(`${BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`, signal)) as {
    status?: number
    product?: unknown
  }
  if (data.status !== 1 || !data.product) return null
  return labelFromOff({ code: clean, ...(data.product as object) })
}

const toResults = (list: unknown[] | undefined): OffResult[] =>
  (list ?? []).map(labelFromOff).filter((x): x is OffResult => x !== null)

export async function searchProducts(query: string, signal?: AbortSignal): Promise<OffResult[]> {
  const q = encodeURIComponent(query.trim())
  if (!q) return []
  // Newer search service first (fast, typo-tolerant); the classic one as fallback.
  try {
    const data = (await getJson(`${SEARCH}/search?q=${q}&page_size=30&fields=${FIELDS}`, signal)) as { hits?: unknown[] }
    const hits = toResults(data.hits)
    if (hits.length) return hits
  } catch (e) {
    if (signal?.aborted) throw e
  }
  const data = (await getJson(
    `${BASE}/cgi/search.pl?search_terms=${q}&search_simple=1&json=1&page_size=20&fields=${FIELDS}`,
    signal,
  )) as { products?: unknown[] }
  return toResults(data.products)
}
