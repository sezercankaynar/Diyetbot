import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sezercankaynar.diyetbot',
  appName: 'Diyetbot',
  webDir: 'dist',
  plugins: {
    // Route fetch() through native HTTP in the app: no CORS limits on the product database.
    CapacitorHttp: { enabled: true },
    // Water reminders: status-bar icon and accent colour.
    LocalNotifications: { smallIcon: 'ic_stat_water', iconColor: '#3a9bd9' },
    // Edge-to-edge: the page pads itself with env(safe-area-inset-*).
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
