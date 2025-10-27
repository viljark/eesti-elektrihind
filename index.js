import { registerRootComponent } from "expo";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
import { Platform } from "react-native";
import App from "./App";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

if (Platform.OS === "web") {
  const LoadSkiaWeb = import("@shopify/react-native-skia/lib/module/web");
  LoadSkiaWeb.then(async (e) => {
    const App = (await import("./App")).default;
    registerRootComponent(App);
  });
} else {
  registerRootComponent(App);
}
