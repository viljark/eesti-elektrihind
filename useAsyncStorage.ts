import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default <T>(
  key: string,
  defaultValue?: T
): [T | null, (data: T) => T, () => void] => {
  const [storageItem, setStorageItem] = useState<T>(null);

  async function getStorageItem() {
    try {
      AsyncStorage.getItem(key, (e, data) => {
        if (data !== null) {
          setStorageItem(
            JSON.parse(data, function (name, value) {
              if (
                typeof value === "string" &&
                /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.test(value)
              ) {
                return new Date(value);
              }
              return value;
            }) as T
          );
        } else {
          setStorageItem(defaultValue);
        }
      });
    } catch (error) {
      setStorageItem(defaultValue ?? null);
    }
  }

  function updateStorageItem(data: T) {
    try {
      AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("error saving data", error);
    }

    setStorageItem(data);
    return data;
  }

  function clearStorageItem() {
    AsyncStorage.removeItem(key);
    setStorageItem(null);
  }

  useEffect(() => {
    getStorageItem();
  }, []);

  return [storageItem, updateStorageItem, clearStorageItem];
};
