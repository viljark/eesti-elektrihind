import { proxy } from "valtio";
import { AppState } from "react-native";

export const state = proxy({ appState: AppState.currentState });

AppState.addEventListener("change", (appState) => {
  state.appState = appState;
});
