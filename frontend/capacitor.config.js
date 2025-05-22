const config = {
  appId: 'com.example.voicesearch',
  appName: 'Voice Search App',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Permissions: {
      permissions: ["microphone"]
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
