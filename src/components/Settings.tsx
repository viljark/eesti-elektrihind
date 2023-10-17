import BottomSheet from "@gorhom/bottom-sheet";
import {
  Appearance,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Toggle } from "./Toggle";
import {
  Bell,
  Clock,
  Percentage,
  Target,
  Paintbucket,
} from "@nandorojo/iconic";
import React, { useMemo, useRef } from "react";
import useAsyncStorage from "../../useAsyncStorage";
import { useBetween } from "use-between";
import analytics from "@react-native-firebase/analytics";

interface Props {
  onClose: () => void;
}

const useSettings = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useAsyncStorage<boolean>("notification", true);
  const [isNotificationColorEnabled, setIsNotificationColorEnabled] =
    useAsyncStorage<boolean>("notificationColor", true);
  const [isHistoryEnabled, setIsHistoryEnabled] = useAsyncStorage<boolean>(
    "history",
    false
  );
  const [isVibrationEnabled, setIsVibrationEnabled] = useAsyncStorage<boolean>(
    "vibration",
    true
  );
  const [isVatEnabled, setIsVatEnabled] = useAsyncStorage<boolean>("vat", true);

  return {
    isNotificationEnabled,
    isNotificationColorEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
    setIsNotificationEnabled,
    setIsNotificationColorEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
    setIsVatEnabled,
  };
};

export const useSharedSettings = () => useBetween(useSettings);

export const Settings: React.FC<Props> = ({ onClose }) => {
  const {
    isNotificationEnabled,
    isNotificationColorEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
    setIsNotificationEnabled,
    setIsNotificationColorEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
    setIsVatEnabled,
  } = useSharedSettings();
  const { width, height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => {
    const snapPoint = ((310 / height) * 100).toFixed() + "%";
    return [snapPoint, snapPoint];
  }, [height]);

  const isLandscape = width > height;

  const toggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    analytics().logEvent("notification_toggle", {
      value: !isNotificationEnabled,
    });
  };
  const toggleNotificationColor = () => {
    setIsNotificationColorEnabled(!isNotificationColorEnabled);
    analytics().logEvent("notification_color_toggle", {
      value: !isNotificationColorEnabled,
    });
  };
  const toggleHistory = () => {
    setIsHistoryEnabled(!isHistoryEnabled);
    analytics().logEvent("history_toggle", {
      value: !isHistoryEnabled,
    });
  };
  const toggleVibration = () => {
    setIsVibrationEnabled(!isVibrationEnabled);
    analytics().logEvent("vibration_toggle", {
      value: !isVibrationEnabled,
    });
  };
  const toggleVat = () => {
    setIsVatEnabled(!isVatEnabled);
    analytics().logEvent("vat_toggle", {
      value: !isVatEnabled,
    });
  };
  const isDarkTheme = Appearance.getColorScheme() === "dark";
  return (
    <BottomSheet
      backdropComponent={(props) => (
        <View {...props} onTouchStart={() => bottomSheetRef.current.close()} />
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
      containerStyle={
        isLandscape
          ? {
              width: "50%",
              marginLeft: width / 4,
            }
          : {}
      }
      ref={bottomSheetRef}
      index={1}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
    >
      <View style={{ paddingTop: 25, flex: 1 }}>
        <ExpoLinearGradient
          colors={["#2c5364", "#203A43", "#0F2027"]}
          start={[0.5, 0]}
          style={{
            ...StyleSheet.absoluteFillObject,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            height: height,
          }}
        />
        <Toggle
          label="Näita elektrihinda teavitustes"
          onToggle={toggleNotification}
          value={isNotificationEnabled}
          Icon={Bell}
        />
        {isNotificationEnabled && (
          <Toggle
            label={
              "Kasuta teavituses värve" +
              (isDarkTheme ? " (ei pruugi tumedas režiimis toimida)" : "")
            }
            onToggle={toggleNotificationColor}
            value={isNotificationColorEnabled}
            Icon={Paintbucket}
          />
        )}

        <Toggle
          label="Näita graafikul eelmiste tundide hinda"
          onToggle={toggleHistory}
          value={isHistoryEnabled}
          Icon={Clock}
        />
        <Toggle
          label="Käibemaks hinna sees"
          onToggle={toggleVat}
          value={isVatEnabled}
          Icon={Percentage}
        />
        <Toggle
          label="Vibreeri graafiku puudutamisel"
          onToggle={toggleVibration}
          value={isVibrationEnabled}
          Icon={Target}
        />
      </View>
    </BottomSheet>
  );
};
