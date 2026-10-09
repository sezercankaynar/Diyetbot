import { ref } from 'vue'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

export type Theme = 'system' | 'light' | 'dark'
const KEY = 'diyetbot-theme'

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Light/dark choice for this device (kept in localStorage so it applies before the app loads). */
export const theme = ref<Theme>(read())

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

function apply() {
  const t = theme.value
  const root = document.documentElement
  if (t === 'system') delete root.dataset.theme
  else root.dataset.theme = t
  const dark = t === 'dark' || (t === 'system' && systemDark())
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    m.removeAttribute('media')
    m.content = dark ? '#0e1311' : '#f3f5f2'
  }
  if (Capacitor.isNativePlatform()) {
    SystemBars.setStyle({ style: t === 'system' ? SystemBarsStyle.Default : dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {})
  }
}

export function setTheme(t: Theme) {
  theme.value = t
  try {
    if (t === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, t)
  } catch {
    // storage unavailable: the choice lasts for this session only
  }
  apply()
}

export function initTheme() {
  apply()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => theme.value === 'system' && apply())
}
