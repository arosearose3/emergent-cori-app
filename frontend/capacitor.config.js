const config = {
  appId: 'com.example.voicesearch',
  appName: 'Voice Search App',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    SpeechRecognition: {
      androidPermissions: ["android.permission.RECORD_AUDIO"]
    }
  },
  server: {
    androidScheme: 'https'
  }
};

module.exports = config;
