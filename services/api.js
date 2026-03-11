/**
 * VulnAssess Mobile — API entry point
 * Uses AsyncStorage as the storage adapter.
 *
 * Drop this file into:  vulnassess-app/services/api.js
 * Also copy apiCore.js into: vulnassess-app/services/apiCore.js
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi } from './apiCore';

/** AsyncStorage already has the right async interface */
const mobileStorage = {
  get:    (key)        => AsyncStorage.getItem(key),
  set:    (key, value) => AsyncStorage.setItem(key, value),
  remove: (key)        => AsyncStorage.removeItem(key),
  clear:  ()           => AsyncStorage.clear(),
};

export const api = createApi(mobileStorage);