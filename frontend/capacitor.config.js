const config = {
  appId: 'com.example.voicesearch',
  appName: 'Voice Search App',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  },
  server: {
    androidScheme: 'https'
  }
};

module.exports = config;
