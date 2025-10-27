import AsyncStorage from "@react-native-async-storage/async-storage";
import { proxy, subscribe } from "valtio";

/**
 * Custom reviver function to parse ISO 8601 date strings back into Date objects.
 * This is used during the JSON.parse step when retrieving data from storage.
 * @param _key The property name being processed.
 * @param value The property value.
 * @returns The original value or a new Date object if the value matches the date format.
 */
const dateReviver = (_key: string, value: any): any => {
  // ISO 8601 format check: YYYY-MM-DDTHH:mm:ss.sssZ
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return new Date(value);
  }
  return value;
};

/**
 * Creates a persisted Valtio state object using AsyncStorage.
 * The state will be initialized with stored data or default values,
 * and changes to the proxy are automatically saved to storage.
 * @template T The type of the state object.
 * @param id A unique identifier for the storage key (e.g., 'user-settings').
 * @param defaultValues The initial state values to use if no data is found in storage.
 * @returns The Valtio proxy state object (T) which is immediately ready to use.
 */
export const createPersistedState = <T extends object>(
  id: string,
  defaultValues: T
): T => {
  const STORAGE_KEY = `persisted-state-${id}`;

  // 1. Initialize the state immediately with default values.
  // We'll update it asynchronously once the stored data is fetched.
  const proxyState = proxy(defaultValues);

  // 2. Asynchronously load data from AsyncStorage and merge it into the proxy.
  const loadState = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        // Parse the stored JSON data, using the reviver for Date objects
        const parsedData = JSON.parse(storedData, dateReviver) as T;

        // Merge the loaded data into the existing proxy state.
        // This updates components listening to the state.
        Object.assign(proxyState, parsedData);
      }
    } catch (e) {
      console.error(`Failed to load state for ${id}:`, e);
      // Fallback: The proxy remains the defaultValues
    }
  };

  // Kick off the loading process immediately.
  loadState();

  // 3. Subscribe to state changes and save to AsyncStorage.
  // Saving is also asynchronous.
  subscribe(proxyState, () => {
    // Note: JSON.stringify will automatically convert Date objects to ISO 8601 strings.
    const dataToStore = JSON.stringify(proxyState);
    AsyncStorage.setItem(STORAGE_KEY, dataToStore).catch((e) => {
      console.error(`Failed to save state for ${id}:`, e);
    });
  });

  // 4. Return the proxy state. It is immediately usable, starting with
  // default values, and will be updated when the async load completes.
  return proxyState;
};
