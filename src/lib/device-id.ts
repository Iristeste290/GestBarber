// Device ID management for anti-fraud system
// Generates and persists a unique device identifier

const DEVICE_ID_KEY = "gestbarber_device_id";

/**
 * Generates a UUID v4
 */
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Gets or creates a persistent device ID
 * The device ID is stored in localStorage and persists across sessions
 */
export const getDeviceId = (): string => {
  try {
    // Check if we already have a device ID
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate a new device ID
      deviceId = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log("[device-id] Generated new device ID");
    }

    return deviceId;
  } catch (error) {
    // If localStorage is not available (e.g., private browsing), generate a temporary ID
    console.warn("[device-id] localStorage not available, using temporary ID");
    return generateUUID();
  }
};

/**
 * Checks if a device ID exists (for debugging purposes)
 */
export const hasDeviceId = (): boolean => {
  try {
    return localStorage.getItem(DEVICE_ID_KEY) !== null;
  } catch {
    return false;
  }
};
