// Sends the week's menu to the Android home-screen widget (MenuWidgetPlugin.java). No-op on the web.
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { WidgetDay } from '@/engine'

interface MenuWidgetPlugin {
  update(o: { data: string }): Promise<void>
}
const MenuWidget = registerPlugin<MenuWidgetPlugin>('MenuWidget')

export async function updateMenuWidget(days: WidgetDay[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await MenuWidget.update({ data: JSON.stringify({ days }) })
  } catch {
    // An older app build without the widget: nothing to update.
  }
}
