import { Capacitor } from '@capacitor/core'

/** Barcode scanning is only available in the Android app (Google code scanner). */
export const canScan = (): boolean => Capacitor.isNativePlatform()

/** Opens the system barcode scanner and returns the code, or null if cancelled. */
export async function scanBarcode(): Promise<string | null> {
  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning')
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
  if (!available) {
    // One-time download of the scanner module through Google Play services.
    await BarcodeScanner.installGoogleBarcodeScannerModule()
    throw new Error('Barkod okuyucu ilk kullanım için indiriliyor. Birkaç saniye sonra tekrar dene.')
  }
  try {
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
    })
    return barcodes[0]?.rawValue ?? null
  } catch (e) {
    if (/cancel/i.test((e as Error).message)) return null
    throw e
  }
}
