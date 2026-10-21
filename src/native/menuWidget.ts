// Sends the week's menu to the Android home-screen widget (MenuWidgetPlugin.java), and receives what a
// widget button asked for ("coach" → open the coach chat). No-op on the web.
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { WidgetDay } from '@/engine'

interface MenuWidgetPlugin {
  update(o: { data: string }): Promise<void>
  takeAction(): Promise<{ action: string | null }>
  addListener(event: 'action', cb: () => void): Promise<{ remove: () => Promise<void> }>
}
const MenuWidget = registerPlugin<MenuWidgetPlugin>('MenuWidget')

/** `ai`: AI is set up in the app, so the widget shows its "Koça sor" button. */
export async function updateMenuWidget(days: WidgetDay[], ai = false): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await MenuWidget.update({ data: JSON.stringify({ days, ai }) })
  } catch {
    // An older app build without the widget: nothing to update.
  }
}

/** The widget button that opened the app, once. */
export async function takeWidgetAction(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    return (await MenuWidget.takeAction()).action ?? null
  } catch {
    return null
  }
}

/** Called when a widget button is tapped while the app is already running. */
export function onWidgetAction(cb: () => void): void {
  if (!Capacitor.isNativePlatform()) return
  MenuWidget.addListener('action', cb).catch(() => {})
}
