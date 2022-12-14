import BottomSheet from "@gorhom/bottom-sheet";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Toggle } from "./Toggle";
import { Bell, Clock, Percentage, Target } from "@nandorojo/iconic";
import React, { useMemo, useRef } from "react";
import useAsyncStorage from "../../useAsyncStorage";
import { useBetween } from "use-between";

interface Props {
  onClose: () => void;
}

const useSettings = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] =
    useAsyncStorage<boolean>("notification", true);
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
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
    setIsNotificationEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
    setIsVatEnabled,
  };
};

export const useSharedSettings = () => useBetween(useSettings);

export const Settings: React.FC<Props> = ({ onClose }) => {
  const {
    isNotificationEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    isVatEnabled,
    setIsNotificationEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
    setIsVatEnabled,
  } = useSharedSettings();
  const { width, height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => {
    const snapPoint = ((300 / height) * 100).toFixed() + "%";
    return [snapPoint, snapPoint];
  }, [height]);

  const isLandscape = width > height;

  const toggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
  };
  const toggleHistory = () => {
    setIsHistoryEnabled(!isHistoryEnabled);
  };
  const toggleVibration = () => {
    setIsVibrationEnabled(!isVibrationEnabled);
  };
  const toggleVat = () => {
    setIsVatEnabled(!isVatEnabled);
  };

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
          label="N??ita elektrihinda teavitustes"
          onToggle={toggleNotification}
          value={isNotificationEnabled}
          Icon={Bell}
        />
        <Toggle
          label="N??ita graafikul eelmiste tundide hinda"
          onToggle={toggleHistory}
          value={isHistoryEnabled}
          Icon={Clock}
        />
        <Toggle
          label="K??ibemaks hinna sees"
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
