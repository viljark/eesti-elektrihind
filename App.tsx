import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useRef, useState } from "react";
import analytics from "@react-native-firebase/analytics";

import notifee from "@notifee/react-native";
import {
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  AppState,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { formatHours, round } from "./formatters";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { commonStyles } from "./styles";
import useAsyncStorage from "./useAsyncStorage";
import { AnimatePresence, MotiView } from "moti";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { usePrevious } from "./usePrevious";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { getCurrentPrices } from "./src/services/getCurrentPrices";
import { Settings, useSharedSettings } from "./src/components/Settings";
import { getColor, getGradient } from "./src/utils/colorUtils";
import { SettingsButton } from "./src/components/SettingsButton";
import { Chart } from "./src/components/Chart";
import { tickFormatter } from "./src/utils/tickFormatter";
import {
  alertNoPermissions,
  getNotificationPermission,
  registerNotificationChannel,
  showPriceNotification,
} from "./src/utils/notification";
import { ONE_HOUR } from "./src/utils/constants";

const BACKGROUND_FETCH_TASK = "background-fetch";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();

  console.log(
    `Got background fetch call at date: ${new Date(now).toISOString()}`
  );
  await showPriceNotification();
  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 20, // 20 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

async function unregisterBackgroundFetchAsync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_FETCH_TASK
  );
  if (!isRegistered) {
    return;
  }
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [color, setColor] = useState("transparent");
  const oldColor = usePrevious(color);
  const [status, setStatus] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useAsyncStorage<
    Array<{ timestamp: number; price: number }>
  >("data", []);
  const hourRef = useRef<TextInput>();
  const hoursToRef = useRef<TextInput>();
  const priceRef = useRef<TextInput>();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const { width, height } = useWindowDimensions();
  const {
    isNotificationEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
    isNotificationColorEnabled,
  } = useSharedSettings();
  const nowHourIndex = isHistoryEnabled ? 6 : 0;

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_200ExtraLight,
    Inter_700Bold,
  });

  const isLandscape = width > height;

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function initNotificationChannel() {
      const { status, token } = await getNotificationPermission();
      if (status !== "granted") {
        alertNoPermissions();
        return;
      }
      await registerNotificationChannel();
      console.log("channel registered");
      setNotificationPermission(true);
      setExpoPushToken(token);
    }

    if (isNotificationEnabled) {
      initNotificationChannel();
    }
  }, [isNotificationEnabled]);

  const _handleAppStateChange = (nextAppState) => {
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  useEffect(() => {
    if (
      appStateVisible === "active" &&
      isHistoryEnabled !== null &&
      isVatEnabled !== null &&
      isNotificationColorEnabled !== null
    ) {
      init();
    }
  }, [
    appStateVisible,
    isHistoryEnabled,
    isVatEnabled,
    isNotificationColorEnabled,
  ]);

  async function init() {
    async function initGraph() {
      const prices = await getCurrentPrices(isHistoryEnabled);
      const formattedPrices = prices.map((entry) => {
        const price = isVatEnabled
          ? round((entry.price + entry.price * 0.2) / 10)
          : round(entry.price / 10);
        return {
          timestamp: entry.timestamp * 1000,
          // eslint-disable-next-line no-compare-neg-zero
          price: price === -0 ? -0.1 : price,
        };
      });
      setData(formattedPrices);
      tickFormatter.cache.clear();
    }
    initGraph();
  }

  useEffect(() => {
    if (
      isNotificationEnabled === null ||
      isVatEnabled === null ||
      isNotificationColorEnabled === null
    ) {
      return;
    }
    if (isNotificationEnabled) {
      checkStatusAsync();

      if (notificationPermission) {
        showPriceNotification();
      }
    } else {
      unregisterBackgroundFetchAsync();
      setIsRegistered(false);
      notifee.cancelDisplayedNotifications();
      AsyncStorage.setItem("lastNowTimestamp", "");
    }
  }, [
    isNotificationEnabled,
    isVatEnabled,
    isNotificationColorEnabled,
    notificationPermission,
  ]);

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    setStatus(status);
    setIsRegistered(isRegistered);
    if (!isRegistered && isNotificationEnabled) {
      await registerBackgroundFetchAsync();
    }
  };

  useEffect(() => {
    if (data?.length && fontsLoaded) {
      setCurrentPrice();
    }
  }, [data, fontsLoaded]);

  const setCurrentPrice = useCallback(() => {
    hourRef.current.setNativeProps({
      text: "hetkel",
    });
    hoursToRef.current.setNativeProps({
      text: "",
    });
    priceRef.current.setNativeProps({
      text: String(data[nowHourIndex].price.toFixed(2)),
    });
    setColor(getColor(data[nowHourIndex].price));
  }, [hourRef, priceRef, hoursToRef, setColor, data, nowHourIndex]);

  const handleBarTouch = useCallback(
    ([{ timestamp, price }]) => {
      const date = new Date(timestamp);
      const hourNow = formatHours(date);
      const nextHour = formatHours(new Date(timestamp + ONE_HOUR));
      const diff = timestamp - new Date().getTime();
      const hours = Math.floor(diff / ONE_HOUR);
      const minutes = Math.round((diff % ONE_HOUR) / (1000 * 60));
      let hoursTo = "";
      if (hours > 0 || minutes > 0) {
        hoursTo = "+";
        if (hours > 0) {
          hoursTo += `${hours}h`;
        }
        if (minutes > 0) {
          hoursTo += `${hoursTo === "+" ? "" : " "}${minutes}min`;
        }
      }
      hourRef.current.setNativeProps({
        text: `${hourNow}:00 - ${nextHour}:00`,
      });
      hoursToRef.current.setNativeProps({
        text: hoursTo,
      });
      priceRef.current.setNativeProps({
        text: String(price.toFixed(2)),
      });
      if (isVibrationEnabled) {
        Haptics.impactAsync(ImpactFeedbackStyle.Light);
      }
      setColor(getColor(price));
    },
    [hourRef, priceRef, hoursToRef, isVibrationEnabled]
  );

  const graphWidth = isLandscape ? 0.7 * width : width - width / 10;

  async function onSettingsPress() {
    setShowSettings(true);
    await analytics().logEvent("settings_open");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={"light"} />
      <View style={styles.container}>
        <MotiView
          style={StyleSheet.absoluteFillObject}
          transition={{ type: "timing", duration: 500 }}
          exitTransition={{ type: "timing", duration: 500 }}
          from={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <ExpoLinearGradient
            colors={getGradient(oldColor)}
            start={[0.5, 0]}
            style={StyleSheet.absoluteFillObject}
          />
        </MotiView>
        <MotiView
          key={color}
          style={StyleSheet.absoluteFillObject}
          transition={{ type: "timing", duration: 200 }}
          exitTransition={{ type: "timing", duration: 200 }}
          from={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <ExpoLinearGradient
            colors={getGradient(color)}
            start={[0.5, 0]}
            style={StyleSheet.absoluteFillObject}
          />
        </MotiView>
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: 0.5,
            backgroundColor: "black",
          }}
        />
        <AnimatePresence>
          {data?.length && fontsLoaded ? (
            <MotiView
              transition={{ type: "spring" }}
              from={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              style={styles.chart}
            >
              <MotiView
                style={StyleSheet.absoluteFillObject}
                transition={{ type: "timing", duration: 500 }}
                exitTransition={{ type: "timing", duration: 500 }}
                from={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
              >
                <ExpoLinearGradient
                  colors={getGradient(oldColor)}
                  start={[isLandscape ? 1.2 : 0.5, 0]}
                  style={styles.chartBackground}
                />
              </MotiView>
              <MotiView
                key={color}
                style={StyleSheet.absoluteFillObject}
                transition={{ type: "timing", duration: 200 }}
                exitTransition={{ type: "timing", duration: 200 }}
                from={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
              >
                <ExpoLinearGradient
                  colors={getGradient(color)}
                  start={[isLandscape ? 1.2 : 0.5, 0]}
                  style={styles.chartBackground}
                />
              </MotiView>
              <View
                style={{
                  display: "flex",
                  flexDirection: isLandscape ? "row" : "column",
                }}
              >
                <View
                  style={{
                    padding: 20,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    width: isLandscape ? 0.25 * width : undefined,
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <TextInput
                      ref={hourRef}
                      editable={false}
                      style={{
                        color: "#fff",
                        fontFamily: "Inter_300Light",
                        minWidth: 43,
                      }}
                    />
                    <TextInput
                      ref={hoursToRef}
                      editable={false}
                      style={styles.hoursTo}
                    />
                  </View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      allowFontScaling={false}
                      ref={priceRef}
                      editable={false}
                      textAlign="center"
                      style={styles.input}
                    />
                    <Text style={styles.cents}>senti / kWh</Text>
                  </View>
                </View>
                <Chart
                  width={graphWidth}
                  landscape={isLandscape}
                  height={height}
                  onActivated={handleBarTouch}
                  onTouchEnd={setCurrentPrice}
                  color={color}
                  data={data}
                  nowHourIndex={nowHourIndex}
                  labels={({ datum, index }) =>
                    index % 1 === 0 ? `${Math.round(datum.price)}` : ""
                  }
                />

                {isLandscape && (
                  <View style={{ position: "absolute", bottom: 0, left: 0 }}>
                    <SettingsButton onPress={onSettingsPress} />
                  </View>
                )}
              </View>
            </MotiView>
          ) : null}
        </AnimatePresence>

        {!!data?.length && fontsLoaded && !isLandscape && (
          <View style={{ marginTop: 24 }}>
            <SettingsButton onPress={() => setShowSettings(true)} />
          </View>
        )}
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  chart: {
    padding: 0,
    position: "relative",
    borderRadius: 16,
    ...commonStyles.blockShadow,
  },
  chartBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 25,
  },
  input: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 58,
    textAlign: "center",
    width: 200,
    textShadowOffset: {
      height: 1,
      width: 1,
    },
    fontFamily: "Inter_300Light",
  },
  hoursTo: {
    color: "#fff",
    fontFamily: "Inter_300Light",
    minWidth: 43,
    fontSize: 11,
    marginTop: -10,
    marginBottom: -15,
  },
  cents: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_200ExtraLight",
  },
});
