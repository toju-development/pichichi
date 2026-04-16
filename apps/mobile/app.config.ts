import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config — replaces static app.json.
 *
 * Key feature: conditionally excludes native-only plugins (like Google Sign-In)
 * when running in Expo Go, so the config plugin system doesn't attempt to
 * reference native modules that aren't compiled into Expo Go's binary.
 *
 * Usage:
 *   Expo Go:     EXPO_USE_EXPO_GO=true npx expo start
 *   Dev client:  npx expo start --dev-client   (plugins included by default)
 *   EAS build:   eas build ...                  (plugins included by default)
 *
 * NOTE: The actual runtime crash guard lives in login.tsx via dynamic import
 * and TurboModuleRegistry error handling. This config-level exclusion is an
 * additional safety layer that prevents plugin-related warnings during
 * config resolution.
 */

const NATIVE_ONLY_PLUGINS: ExpoConfig['plugins'] = [
  [
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme:
        'com.googleusercontent.apps.883384274738-thd39abk38veh2p31bosdq1dh2m4hqug',
    },
  ],
];

const UNIVERSAL_PLUGINS: ExpoConfig['plugins'] = [
  'expo-router',
  'expo-secure-store',
  'expo-apple-authentication',
];

export default ({ config }: ConfigContext): ExpoConfig => {
  // Developers set EXPO_USE_EXPO_GO=true when they want to use Expo Go.
  // By default (unset), all plugins are included — dev client, EAS, and
  // production builds all work out of the box.
  const isExpoGo = process.env.EXPO_USE_EXPO_GO === 'true';

  const plugins: ExpoConfig['plugins'] = [...UNIVERSAL_PLUGINS];

  if (!isExpoGo) {
    plugins.push(...NATIVE_ONLY_PLUGINS);
  }

  return {
    name: 'Pichichi',
    slug: 'pichichi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'pichichi',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B6E4F',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pichichi.app',
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0B6E4F',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.pichichi.app',
      navigationBarColor: 'transparent',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '07ac2698-c8b5-4627-811c-8258fd06df2c',
      },
    },
  };
};
