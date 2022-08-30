import BottomSheet from "@gorhom/bottom-sheet";
import { Dimensions, StyleSheet, View } from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Toggle } from "./Toggle";
import { Bell, Clock, Target } from "@nandorojo/iconic";
import React, { useMemo, useRef } from "react";
import useAsyncStorage from "../../useAsyncStorage";
import { useBetween } from "use-between";

const height = Dimensions.get("window").height;

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

  return {
    isNotificationEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    setIsNotificationEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
  };
};

export const useSharedSettings = () => useBetween(useSettings);

export const Settings: React.FC<Props> = ({ onClose }) => {
  const {
    isNotificationEnabled,
    isHistoryEnabled,
    isVibrationEnabled,
    setIsNotificationEnabled,
    setIsHistoryEnabled,
    setIsVibrationEnabled,
  } = useSharedSettings();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => {
    const snapPoint = ((280 / height) * 100).toFixed() + "%";
    return [snapPoint, snapPoint];
  }, []);

  const toggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
  };
  const toggleHistory = () => {
    setIsHistoryEnabled(!isHistoryEnabled);
  };
  const toggleVibration = () => {
    setIsVibrationEnabled(!isVibrationEnabled);
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
      ref={bottomSheetRef}
      index={1}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
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
        <Toggle
          label="Näita hinda teavituste ribal"
          onToggle={toggleNotification}
          value={isNotificationEnabled}
          Icon={Bell}
        />
        <Toggle
          label="Näita graafikul eelmiste tundide hinda"
          onToggle={toggleHistory}
          value={isHistoryEnabled}
          Icon={Clock}
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