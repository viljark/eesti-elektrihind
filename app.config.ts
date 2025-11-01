import { ExpoConfig, ConfigContext } from "expo/config";

// Determine if we are in a development environment
const isDev = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "viljark",
  name: isDev ? "Elektrihind DEV" : "Elektrihind",
  slug: isDev ? "eesti-elektrihind-dev" : "eesti-elektrihind",
  version: "2.0.3",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  updates: {
    fallbackToCacheTimeout: 0,
    // TODO: Create a new EAS Update channel/URL for the dev environment
    url: isDev
      ? "https://u.expo.dev/94cc5948-bade-4c06-a1c5-967f31ca89e9"
      : "https://u.expo.dev/94cc5948-bade-4c06-a1c5-967f31ca89e9",
  },
  assetBundlePatterns: ["**/*"],

  ios: {
    supportsTablet: true,
    buildNumber: "2.0.3",
    bundleIdentifier: isDev
      ? "com.viljark.eestielektrihind.dev"
      : "com.viljark.eestielektrihind",
  },
  notification: {
    icon: "assets/notification-icon.png",
  },
  android: {
    googleServicesFile: isDev
      ? "./google-services-dev.json"
      : "./google-services.json",
    versionCode: 23,
    adaptiveIcon: {
      foregroundImage: isDev
        ? "./assets/adaptive-icon-dev.png"
        : "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: isDev
      ? "com.viljark.eestielektrihind.dev"
      : "com.viljark.eestielektrihind",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  runtimeVersion: "2.0.3",
  extra: {
    eas: {
      projectId: isDev
        ? "3a071a1f-9d24-43e7-9807-2718d5f0e688"
        : "94cc5948-bade-4c06-a1c5-967f31ca89e9",
    },
  },
  plugins: [
    "@react-native-firebase/app",
    "@react-native-firebase/perf",
    "@react-native-firebase/crashlytics",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#000000",
        image: isDev
          ? "./assets/adaptive-icon-dev.png"
          : "./assets/adaptive-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
});
