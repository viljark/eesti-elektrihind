import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  Appearance,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Toggle } from "./Toggle";
import React, { useMemo, useRef } from "react";
import analytics from "@react-native-firebase/analytics";
import { createPersistedState } from "../../persistedState";
import { useSnapshot } from "valtio/react";

interface Props {
  onClose: () => void;
}

export const settingsState = createPersistedState("settings", {
  isNotificationEnabled: true,
  isNotificationColorEnabled: true,
  isHistoryEnabled: false,
  isVatEnabled: true,
  is15min: false,
});

export const Settings: React.FC<Props> = ({ onClose }) => {
  const { width, height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => {
    const snapPoint = ((310 / height) * 100).toFixed() + "%";
    return [snapPoint, snapPoint];
  }, [height]);

  const isLandscape = width > height;

  const {
    isNotificationColorEnabled,
    isNotificationEnabled,
    isVatEnabled,
    isHistoryEnabled,
  } = useSnapshot(settingsState);

  const toggleNotification = () => {
    settingsState.isNotificationEnabled = !isNotificationEnabled;
    analytics().logEvent("notification_toggle", {
      value: !isNotificationEnabled,
    });
  };
  const toggleNotificationColor = () => {
    settingsState.isNotificationColorEnabled = !isNotificationColorEnabled;

    analytics().logEvent("notification_color_toggle", {
      value: !isNotificationColorEnabled,
    });
  };
  const toggleHistory = () => {
    settingsState.isHistoryEnabled = !isHistoryEnabled;

    analytics().logEvent("history_toggle", {
      value: !isHistoryEnabled,
    });
  };
  const toggleVat = () => {
    settingsState.isVatEnabled = !isVatEnabled;

    analytics().logEvent("vat_toggle", {
      value: !isVatEnabled,
    });
  };
  const isDarkTheme = Appearance.getColorScheme() === "dark";
  return (
    // @ts-ignore
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
      {/*@ts-ignore*/}
      <BottomSheetView style={{ paddingTop: 25, flex: 1 }}>
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
          icon="alert-circle"
        />
        {isNotificationEnabled && (
          <Toggle
            label={
              "Kasuta teavituses värve" +
              (isDarkTheme ? " (ei pruugi tumedas režiimis toimida)" : "")
            }
            onToggle={toggleNotificationColor}
            value={isNotificationColorEnabled}
            icon="format-color-fill"
          />
        )}

        <Toggle
          label="Näita graafikul eelmiste tundide hinda"
          onToggle={toggleHistory}
          value={isHistoryEnabled}
          icon="history"
        />
        <Toggle
          label="Käibemaks hinna sees"
          onToggle={toggleVat}
          value={isVatEnabled}
          icon="percent"
        />
      </BottomSheetView>
    </BottomSheet>
  );
};
