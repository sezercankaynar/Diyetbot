// Shortcuts to the phone's settings and a check of background restrictions (DeviceSettingsPlugin.java).
import { Capacitor, registerPlugin } from '@capacitor/core'

interface DeviceSettingsPlugin {
  status(): Promise<{ backgroundRestricted: boolean; manufacturer: string }>
  openNotificationSettings(): Promise<void>
  openAppSettings(): Promise<void>
}
const DeviceSettings = registerPlugin<DeviceSettingsPlugin>('DeviceSettings')

export async function deviceStatus(): Promise<{ backgroundRestricted: boolean; manufacturer: string } | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    return await DeviceSettings.status()
  } catch {
    return null
  }
}
export const openNotificationSettings = () => (Capacitor.isNativePlatform() ? DeviceSettings.openNotificationSettings().catch(() => {}) : Promise.resolve())
export const openAppSettings = () => (Capacitor.isNativePlatform() ? DeviceSettings.openAppSettings().catch(() => {}) : Promise.resolve())
