import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidNotificationVisibility } from "expo-notifications";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  AppState,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { formatHours, round } from "./formatters";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryTheme,
  VictoryVoronoiContainer,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { commonStyles } from "./styles";
import useAsyncStorage from "./useAsyncStorage";
import { AnimatePresence, MotiView } from "moti";
import { Settings as SettingsIcon } from "@nandorojo/iconic";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiPressable } from "moti/interactions";
import { usePrevious } from "./usePrevious";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { getCurrentPrices } from "./src/services/getCurrentPrices";
import { Settings, useSharedSettings } from "./src/components/Settings";
import {
  getColor,
  getGradient,
  getGradientTopColor,
  getNotificationIconColor,
} from "./src/utils/colorUtils";
import { CustomBar } from "./src/components/CustomBar";
import _ from "lodash";

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

// 2. Register the task at some point in your app by providing the same name, and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 20, // 20 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
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
const width = Dimensions.get("window").width;

const ONE_HOUR = 1000 * 60 * 60;

function _tickFormatter(date: Date) {
  const now = new Date().getHours();
  const nowOdd = now % 2;
  return date.getHours() % 2 === nowOdd ? formatHours(date) : "";
}

const tickFormatter = _.memoize(_tickFormatter, (value) => value.getTime());

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [color, setColor] = useState("transparent");
  const oldColor = usePrevious(color);
  const [status, setStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useAsyncStorage<
    Array<{ timestamp: number; price: number }>
  >("data", []);
  const hourRef = useRef<TextInput>();
  const hoursToRef = useRef<TextInput>();
  const priceRef = useRef<TextInput>();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const {
    isNotificationEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
  } = useSharedSettings();
  const nowHourIndex = isHistoryEnabled ? 6 : 0;

  let [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_200ExtraLight,
    Inter_700Bold,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const _handleAppStateChange = (nextAppState) => {
    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  useEffect(() => {
    if (
      appStateVisible === "active" &&
      isHistoryEnabled !== null &&
      isVatEnabled !== null
    ) {
      init();
    }
  }, [appStateVisible, isHistoryEnabled, isVatEnabled]);

  async function init() {
    async function initGraph() {
      const prices = await getCurrentPrices(isHistoryEnabled);
      const formattedPrices = prices.map((entry) => {
        return {
          timestamp: entry.timestamp * 1000,
          price: isVatEnabled
            ? round((entry.price + entry.price * 0.2) / 10)
            : round(entry.price / 10),
        };
      });
      setData(formattedPrices);
    }
    initGraph();
  }

  useEffect(() => {
    if (isNotificationEnabled === null || isVatEnabled === null) {
      return;
    }
    if (isNotificationEnabled) {
      checkStatusAsync();
      channelPromise.then(() => {
        showPriceNotification();
      });
    } else {
      unregisterBackgroundFetchAsync();
      setIsRegistered(false);
      Notifications.dismissAllNotificationsAsync();
      AsyncStorage.setItem("lastNowTimestamp", "");
    }
  }, [isNotificationEnabled, isVatEnabled]);

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

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });
  }, []);

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
        text: `${hourNow}:00 -  ${nextHour}:00`,
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
                  start={[0.5, 0]}
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
                  start={[0.5, 0]}
                  style={styles.chartBackground}
                />
              </MotiView>
              <View
                style={{
                  padding: 20,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
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
                    style={{
                      color: "#fff",
                      fontFamily: "Inter_300Light",
                      minWidth: 43,
                      fontSize: 11,
                      marginTop: -10,
                      marginBottom: -15,
                    }}
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
                    ref={priceRef}
                    editable={false}
                    textAlign="center"
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: 58,
                      textAlign: "center",
                      width: 200,
                      textShadowOffset: {
                        height: 1,
                        width: 1,
                      },
                      fontFamily: "Inter_300Light",
                    }}
                  />
                  <Text
                    style={{
                      marginLeft: 12,
                      color: "#fff",
                      fontSize: 14,
                      fontFamily: "Inter_200ExtraLight",
                    }}
                  >
                    senti / kWh
                  </Text>
                </View>
              </View>

              <VictoryChart
                width={width - 40}
                height={350}
                padding={{
                  left: 35,
                  top: 35,
                  bottom: 35,
                  right: 10,
                }}
                scale={{ x: "time" }}
                domainPadding={{ x: 11, y: 0 }}
                theme={VictoryTheme.material}
                containerComponent={
                  <VictoryVoronoiContainer
                    voronoiDimension="x"
                    activateLabels={false}
                    onActivated={handleBarTouch}
                    onTouchEnd={setCurrentPrice}
                  />
                }
              >
                <Defs>
                  {/* @ts-ignore */}
                  <LinearGradient
                    id="linear"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                    // gradientTransform="rotate(10)"
                  >
                    <Stop offset="0%" stopColor="#2c5364" />
                    <Stop offset="50%" stopColor="#203A43" />
                    <Stop offset="100%" stopColor="#0F2027" />
                  </LinearGradient>
                  {/* @ts-ignore */}
                  <LinearGradient
                    id="selectedHour"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={getGradientTopColor(color)} />
                    <Stop offset="100%" stopColor="#0F2027" />
                  </LinearGradient>
                  {/* @ts-ignore */}
                  <LinearGradient
                    id="currentHour"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={getGradientTopColor(
                        getColor(data[nowHourIndex].price)
                      )}
                    />
                    <Stop offset="100%" stopColor="#0F2027" />
                  </LinearGradient>
                </Defs>
                <VictoryBar
                  data={data}
                  x="timestamp"
                  y="price"
                  barWidth={width / 24 - 6}
                  cornerRadius={{ top: (width / 24 - 6) / 2 }}
                  dataComponent={<CustomBar />}
                  style={{
                    data: {
                      fill: "url(#linear)",
                    },
                  }}
                  labels={({ datum, index }) =>
                    index % 1 === 0 ? `${Math.round(datum.price)}` : ""
                  }
                  labelComponent={
                    <VictoryLabel
                      style={{
                        fill: "white",
                        fontSize: 8,
                      }}
                      dy={-5}
                    />
                  }
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    grid: { stroke: "none" },
                    axis: {
                      stroke: "none",
                    },
                    ticks: {
                      stroke: "none",
                    },
                    tickLabels: { fill: "white", fontSize: 10 },
                    axisLabel: { fill: "white", fontSize: 8 },
                  }}
                />
                <VictoryAxis
                  tickCount={data.length}
                  tickFormat={tickFormatter}
                  style={{
                    grid: { stroke: "none" },
                    axis: {
                      stroke: "#0F2027",
                      strokeWidth: 1,
                      strokeOpacity: 1,
                    },
                    ticks: {
                      stroke: "none",
                    },
                    tickLabels: { fill: "white", fontSize: 10 },
                  }}
                />
              </VictoryChart>
            </MotiView>
          ) : null}
        </AnimatePresence>

        <MotiPressable
          transition={{ type: "timing", duration: 100 }}
          onPress={() => {
            setShowSettings(true);
          }}
          style={{
            padding: 10,
            opacity: data?.length && fontsLoaded ? 1 : 0,
          }}
          animate={useMemo(
            () =>
              ({ pressed }) => {
                "worklet";

                return {
                  scale: pressed ? 0.8 : 1,
                };
              },
            []
          )}
        >
          <SettingsIcon width={42} height={42} color="white" />
        </MotiPressable>
        <TouchableOpacity
          onPressIn={() => setShowSettings(true)}
        ></TouchableOpacity>
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
    marginBottom: 24,
  },
  chartBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 25,
  },
});

async function showPriceNotification() {
  const prices = await getCurrentPrices();
  const lastNowTimestamp = await AsyncStorage.getItem("lastNowTimestamp");
  const isVatEnabled = await AsyncStorage.getItem("vat");
  if (
    lastNowTimestamp &&
    lastNowTimestamp === String(prices[0].timestamp) + isVatEnabled
  ) {
    console.log("skipped notification");
    return;
  } else {
    AsyncStorage.setItem(
      "lastNowTimestamp",
      String(prices[0].timestamp) + isVatEnabled
    );
  }
  const formattedPrices = prices.map((entry) => {
    const time = new Date(entry.timestamp * 1000);
    const nextHour = new Date(time.getTime() + ONE_HOUR);
    return {
      hours: `${formatHours(time)} - ${formatHours(nextHour)}`,
      price:
        isVatEnabled === "true" || isVatEnabled === ""
          ? Math.round((entry.price + entry.price * 0.2) / 10)
          : Math.round(entry.price / 10),
    };
  });
  const [currentPrice, ...nextPrices] = formattedPrices;
  const body = nextPrices
    .slice(0, 12)
    .map((nextPrice) => {
      return `${nextPrice.price} s/kWh • ${nextPrice.hours}`;
    })
    .join("\n");

  const color = getNotificationIconColor(currentPrice.price);
  await schedulePushNotification({
    title: `${currentPrice.price} senti/kWh • ${currentPrice.hours}`,
    body,
    color,
  });
}

async function schedulePushNotification({ title, body, color }) {
  await Notifications.dismissAllNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sticky: true,
      sound: false,
      vibrate: [0, 0, 0, 0],
      priority: "high",
      color,
      autoDismiss: false,
    },

    trigger: {
      seconds: 1,
      channelId: "price",
    },
  });
}

let channelResolve;
let channelPromise = new Promise((resolve, reject) => {
  channelResolve = resolve;
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("price", {
    name: "Elektrihind",
    importance: Notifications.AndroidImportance.MIN,
    enableVibrate: false,
    sound: undefined,
    enableLights: false,
    showBadge: false,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  }).then(() => {
    channelResolve();
  });

  console.log("channel registered");
} else {
  channelResolve();
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.requestPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.getPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    // alert("Must use physical device for Push Notifications");
  }

  return token;
}
