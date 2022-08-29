import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  useFonts,
  Inter_700Bold,
  Inter_300Light,
  Inter_200ExtraLight,
} from "@expo-google-fonts/inter";
import {
  Text,
  View,
  Button,
  Platform,
  StyleSheet,
  Dimensions,
  TextInput,
  Vibration,
  AppState,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Subscription } from "expo-modules-core/src/EventEmitter";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { formatHours, round } from "./formatters";
import {
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryLabel,
  VictoryVoronoiContainer,
  Bar,
} from "victory-native";
import {
  Defs,
  LinearGradient,
  Path,
  Stop,
  ForeignObject,
  G,
} from "react-native-svg";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { blockBackground, commonStyles } from "./styles";
import useAsyncStorage from "./useAsyncStorage";
import { AnimatePresence, MotiView } from "moti";
import { Settings } from "@nandorojo/iconic";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiPressable } from "moti/interactions";
import { BarProps } from "victory-bar";
const BACKGROUND_FETCH_TASK = "background-fetch";
import Chroma from "chroma-js";
import { usePrevious } from "./usePrevious";
import { maxBy } from "lodash";
import { StatusBar } from "expo-status-bar";

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
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
    minimumInterval: 60 * 15, // 15 minutes
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
const height = Dimensions.get("window").height;
const absurd = 380;
const veryHigh = 19.2;
const high = 11.2;
const average = 5;
const low = 2;

const getGradient = (color: string) => {
  switch (color) {
    case "magenta":
      return ["#e722dd", "#7c4b6c", "#355C7D"];
    case "red":
      return ["#ff0000", "#6C5B7B", "#355C7D"];
    case "yellow":
      return ["#c0b96c", "#7b785b", "#355C7D"];
    case "lightgreen":
      return ["#84c06c", "#5f7b5b", "#355C7D"];
  }
  return ["#C06C84", "#6C5B7B", "#355C7D"];
};

const CustomTooltip = (props) => {
  return null;
};

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
  const [isRegistered, setIsRegistered] = useState(false);
  const [color, setColor] = useState("transparent");
  const oldColor = usePrevious(color);
  const [status, setStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useAsyncStorage<
    Array<{ hours: string; price: number }>
  >("data", []);
  const hourRef = useRef<TextInput>();
  const priceRef = useRef<TextInput>();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const timer = useRef<NodeJS.Timer>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useAsyncStorage<boolean>("notification", true);
  const toggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
  };
  // variables
  const snapPoints = useMemo(() => ["20%", "20%"], []);

  useEffect(() => {
    if ([color, oldColor].includes("transparent")) {
      return;
    }
  }, [color]);

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
    if (appStateVisible === "active") {
      init();
    }
  }, [appStateVisible]);

  async function init() {
    async function initGraph() {
      const prices = await getCurrentPrices();
      const formattedPrices = prices.map((entry) => {
        const time = new Date(entry.timestamp * 1000);
        return {
          hours: formatHours(time),
          price: round((entry.price + entry.price * 0.2) / 10),
        };
      });
      setData(formattedPrices);
    }
    initGraph();
  }

  useEffect(() => {
    if (isNotificationEnabled === null) {
      return;
    }
    if (isNotificationEnabled) {
      checkStatusAsync();
      showPriceNotification();
    } else {
      unregisterBackgroundFetchAsync();
      setIsRegistered(false);
      Notifications.dismissAllNotificationsAsync();
    }
  }, [isNotificationEnabled]);

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

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  useEffect(() => {
    if (data?.length && fontsLoaded) {
      setCurrentPrice();
    }
  }, [data, fontsLoaded]);

  const setCurrentPrice = () => {
    hourRef.current.setNativeProps({
      text: "hetkel",
    });
    priceRef.current.setNativeProps({
      text: String(data[0].price.toFixed(2)),
    });
    setColor(getColor(data[0].price));
  };

  const getColor = (price: number) => {
    return price >= absurd
      ? "magenta"
      : price >= veryHigh
      ? "red"
      : price >= high
      ? "yellow"
      : price >= average
      ? "lightgreen"
      : "lightgreen";
  };

  const getGradientTopColor = (color: string) => {
    switch (color) {
      case "magenta":
        return "#e722dd";
      case "red":
        return "#ff0000";
      case "yellow":
        return "#c0b96c";
      case "lightgreen":
        return "#84c06c";
    }
    return "#bd5d78";
  };

  const getGradientBottomColor = (color: string) => {
    switch (color) {
      case "magenta":
        return "#7c4b6c";
      case "red":
        return "#6C5B7B";
      case "yellow":
        return "#7b785b";
      case "lightgreen":
        return "#5f7b5b";
    }
    return "#6C5B7B";
  };

  const getGradientAnimationDirection = (
    nextColor: string,
    currentColor: string
  ) => {
    const colors = ["magenta", "red", "yellow", "lightgreen"];
    return colors.indexOf(nextColor) - colors.indexOf(currentColor);
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        showPriceNotification();
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        {/*<ExpoLinearGradient*/}
        {/*  start={[-0.5, 0]}*/}
        {/*  colors={["#2c5364", "#203A43", "#0F2027"]}*/}
        {/*  style={styles.background}*/}
        {/*/>*/}
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
                {/*<ExpoLinearGradient*/}
                {/*  colors={["#2c5364", "#203A43", "#0F2027"]}*/}
                {/*  start={[0.5, 0]}*/}
                {/*  style={{*/}
                {/*    ...StyleSheet.absoluteFillObject,*/}
                {/*    borderTopLeftRadius: 16,*/}
                {/*    borderTopRightRadius: 16,*/}
                {/*  }}*/}
                {/*/>*/}
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
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
                      // textShadowColor: color,
                      // textShadowRadius: 20,
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
                domainPadding={{ x: 11, y: 0 }}
                theme={VictoryTheme.material}
                events={[
                  {
                    target: "data",
                    eventHandlers: {},
                  },
                ]}
                containerComponent={
                  <VictoryVoronoiContainer
                    voronoiDimension="x"
                    onActivated={([{ hours, price }]) => {
                      const hourNow = Number(hours);
                      const nextHour = hourNow === 23 ? 0 : hourNow + 1;
                      hourRef.current.setNativeProps({
                        text: `${hours}:00-${
                          nextHour < 10 ? "0" + nextHour : nextHour
                        }:00`,
                      });
                      priceRef.current.setNativeProps({
                        text: String(price.toFixed(2)),
                      });
                      Vibration.vibrate([0, 0, 0, 1]);
                      setColor(getColor(price));
                    }}
                    onTouchEnd={() => {
                      setCurrentPrice();
                    }}
                    labels={({ datum }) =>
                      `${datum.hours} • ${datum.price} senti/kWh`
                    }
                    labelComponent={<CustomTooltip />}
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
                    id="linearBorder"
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
                    id="current"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={getGradientTopColor(getColor(data[0].price))}
                    />
                    <Stop offset="100%" stopColor="#0F2027" />
                  </LinearGradient>
                </Defs>
                <VictoryBar
                  data={data}
                  x="hours"
                  y="price"
                  barWidth={11}
                  cornerRadius={{ top: 5.5 }}
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
                  events={[
                    {
                      target: "data",
                      eventHandlers: {
                        onActivated: () => {
                          return [
                            {
                              target: "data",
                              mutation: () => ({
                                style: { fill: "gold" },
                              }),
                            },
                          ];
                        },
                        onPressOut: () => {
                          return [
                            {
                              target: "data",
                              mutation: () => {},
                            },
                          ];
                        },
                      },
                    },
                  ]}
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
                  tickCount={Math.round(data.length / 3)}
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
          <Settings width={42} height={42} color="white" />
        </MotiPressable>
        <TouchableOpacity
          onPressIn={() => setShowSettings(true)}
        ></TouchableOpacity>
        {showSettings && (
          <BottomSheet
            backdropComponent={(props) => (
              <View
                {...props}
                onTouchStart={() => bottomSheetRef.current.close()}
              />
            )}
            backgroundStyle={{
              backgroundColor: "transparent",
            }}
            handleStyle={{
              padding: 0,
            }}
            handleIndicatorStyle={{
              backgroundColor: "#fff",
              position: "relative",
              top: 10,
            }}
            ref={bottomSheetRef}
            index={1}
            animateOnMount
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            onClose={() => {
              setShowSettings(false);
            }}
          >
            <View style={{ paddingTop: 25 }}>
              <ExpoLinearGradient
                colors={["#2c5364", "#203A43", "#0F2027"]}
                start={[0.5, 0]}
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  height: height / 2,
                }}
              />
              <View
                style={{ borderBottomColor: "#203A43", borderBottomWidth: 1 }}
              >
                <TouchableOpacity
                  onPress={toggleNotification}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-around",
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Inter_200ExtraLight",
                      zIndex: 1,
                    }}
                  >
                    Näita elektrihinda teavitusena
                  </Text>

                  <Switch
                    trackColor={{ false: "#767577", true: "#203A43" }}
                    thumbColor={isNotificationEnabled ? "#C06C84" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    value={isNotificationEnabled}
                    onValueChange={toggleNotification}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const CustomBar = (props: BarProps) => {
  const hours = props.datum.hours;

  const active = hours === `${formatHours(new Date())}`;
  return (
    <Bar
      {...props}
      style={{
        borderColor: "red",
        ...props.style,

        fill: props.active
          ? "url(#linearBorder)"
          : active
          ? "url(#current)"
          : props.style.fill,
      }}
    />
  );
};

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

async function getCurrentPrices() {
  const start = new Date();
  start.setMinutes(0);
  start.setSeconds(0);
  start.setMilliseconds(0);

  const end = new Date(start.getTime() + 1000 * 60 * 60 * 23);
  const response = await fetch(
    "https://dashboard.elering.ee/api/nps/price?" +
      new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());
  const price =
    (response.data.ee[0].price + response.data.ee[0].price * 0.2) / 10;
  return response.data.ee;
}

async function showPriceNotification() {
  const prices = await getCurrentPrices();
  const formattedPrices = prices.map((entry) => {
    const time = new Date(entry.timestamp * 1000);
    const nextHour = new Date(time.getTime() + 1000 * 60 * 60);
    return {
      hours: `${formatHours(time)}-${formatHours(nextHour)}`,
      price: Math.round((entry.price + entry.price * 0.2) / 10),
    };
  });
  const [currentPrice, ...nextPrices] = formattedPrices;
  const body = nextPrices
    .slice(0, 2)
    .map((nextPrice) => {
      return `${nextPrice.price} s/kWh • ${nextPrice.hours}`;
    })
    .join("\n");

  const color =
    currentPrice.price >= absurd
      ? "magenta"
      : currentPrice.price >= veryHigh
      ? "red"
      : currentPrice.price >= high
      ? "yellow"
      : currentPrice.price >= average
      ? "green"
      : "green";
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
      vibrate: undefined,
      color,
    },

    trigger: null,
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
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

  if (Platform.OS === "android") {
    await Notifications.deleteNotificationChannelAsync("silent");
    await Notifications.setNotificationChannelAsync("silent", {
      name: "silent",
      importance: Notifications.AndroidImportance.LOW,
      lightColor: "#FF231F7C",
      enableVibrate: false,
      sound: undefined,
    });
  }

  return token;
}
