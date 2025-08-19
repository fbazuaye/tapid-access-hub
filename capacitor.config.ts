import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.acf9bf9dcc1d4a2481e0e6b5c73e9840',
  appName: 'tapid-access-hub',
  webDir: 'dist',
  server: {
    url: 'https://acf9bf9d-cc1d-4a24-81e0-e6b5c73e9840.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#999999'
    }
  }
};

export default config;