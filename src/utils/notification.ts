import { getCurrentPrices } from "../services/getCurrentPrices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatHours } from "../../formatters";
import {
  getNotificationIconColor,
  getNotificationTextColor,
} from "./colorUtils";
import { uniqueId } from "lodash";
import notifee, { AndroidStyle, EventType } from "@notifee/react-native";
import { ONE_HOUR } from "./constants";
import analytics from "@react-native-firebase/analytics";
import * as Notifications from "expo-notifications";
import { AndroidNotificationVisibility } from "expo-notifications";
import { Alert } from "react-native";
import * as Linking from "expo-linking";

export async function registerNotificationChannel() {
  return Notifications.setNotificationChannelAsync("price", {
    name: "Elektrihind",
    importance: Notifications.AndroidImportance.MIN,
    enableVibrate: false,
    sound: undefined,
    enableLights: false,
    showBadge: false,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  });
}

export function alertNoPermissions() {
  Alert.alert("Teavitused on keelatud", "Luba teavitused süsteemi seadetest", [
    {
      text: "Ava seaded",
      onPress: () => {
        Linking.openSettings();
      },
    },
    {
      text: "Sulge",
    },
  ]);
}

export async function getNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus;
}

notifee.onForegroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction.id === "update") {
    notifee.hideNotificationDrawer();
    await showPriceNotification();
    await analytics().logEvent("notification_action_update");
  }
});

notifee.onBackgroundEvent(async (event) => {
  if (
    event.type === EventType.ACTION_PRESS &&
    event.detail.pressAction.id === "update"
  ) {
    await showPriceNotification();
    await analytics().logEvent("notification_action_update");
  }
  return Promise.resolve();
});

export async function showPriceNotification() {
  const prices = await getCurrentPrices();
  const lastNowTimestamp = await AsyncStorage.getItem("lastNowTimestamp");
  const isVatEnabled = await AsyncStorage.getItem("vat");
  if (
    lastNowTimestamp &&
    lastNowTimestamp === String(prices[0].timestamp) + isVatEnabled
  ) {
    // return;
  } else {
    AsyncStorage.setItem(
      "lastNowTimestamp",
      String(prices[0].timestamp) + isVatEnabled
    );
  }
  const formattedPrices = prices.map((entry) => {
    const time = new Date(entry.timestamp * 1000);
    const nextHour = new Date(time.getTime() + ONE_HOUR);
    const price =
      isVatEnabled === "true" || isVatEnabled === null
        ? Math.round((entry.price + entry.price * 0.2) / 10)
        : Math.round(entry.price / 10);
    return {
      hours: `${formatHours(time)} - ${formatHours(nextHour)}`,
      // eslint-disable-next-line no-compare-neg-zero
      price: price === -0 ? 0 : price,
    };
  });
  const [currentPrice, ...nextPrices] = formattedPrices;

  const isNotificationColorEnabled =
    (await AsyncStorage.getItem("notificationColor")) !== "false";

  const body = nextPrices
    .slice(0, 12)
    .map((nextPrice) => {
      const textColor = getNotificationTextColor(nextPrice.price);
      if (isNotificationColorEnabled) {
        return `<span style="color:${textColor}"><strong>${nextPrice.price} s/kWh</strong></span> • <i>${nextPrice.hours}</i>`;
      }
      return `<strong>${nextPrice.price} s/kWh</strong> • <i>${nextPrice.hours}</i>`;
    })
    .join("\n");

  const color = getNotificationIconColor(currentPrice.price);
  const textColor = getNotificationTextColor(currentPrice.price);

  await showPushNotification({
    title: isNotificationColorEnabled
      ? `<span style="color:${textColor}"><strong>${currentPrice.price} s/kWh</strong></span>  • <i>${currentPrice.hours}</i>`
      : `<strong>${currentPrice.price} s/kWh</strong>  • <i>${currentPrice.hours}</i>`,
    body,
    color,
  });
}

async function showPushNotification({ title, body, color }) {
  let id = (await AsyncStorage.getItem("notificationId")) || null;
  if (!id) {
    id = uniqueId("notification");
    await AsyncStorage.setItem("notificationId", id);
  }
  await notifee.displayNotification({
    id,
    title: title,
    body,
    android: {
      smallIcon: "notification_icon",
      channelId: "price",
      color: color,
      timestamp: Date.now(),
      showTimestamp: true,
      ongoing: true,
      autoCancel: false,
      style: {
        type: AndroidStyle.INBOX,
        lines: body.split("\n"),
      },
      pressAction: {
        id: "default",
      },
      actions: [
        {
          title: "Uuenda andmeid",
          pressAction: {
            id: "update",
          },
        },
      ],
    },
  });
}
