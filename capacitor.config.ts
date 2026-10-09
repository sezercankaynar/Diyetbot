import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sezercankaynar.diyetbot',
  appName: 'Diyetbot',
  webDir: 'dist',
  plugins: {
    // Route fetch() through native HTTP in the app: no CORS limits on the product database.
    CapacitorHttp: { enabled: true },
    // Edge-to-edge: the page pads itself with env(safe-area-inset-*).
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
