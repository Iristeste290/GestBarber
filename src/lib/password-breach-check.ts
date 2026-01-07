/**
 * Password breach check using HaveIBeenPwned API with k-anonymity
 * 
 * How it works:
 * 1. Hash the password using SHA-1
 * 2. Send only the first 5 characters of the hash to the API
 * 3. The API returns all hashes that start with those 5 characters
 * 4. Check locally if the full hash is in the returned list
 * 
 * This is privacy-preserving because the full password is never sent.
 */

async function sha1Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export interface BreachCheckResult {
  isBreached: boolean;
  count: number;
  error?: string;
}

/**
 * Checks if a password has been exposed in data breaches
 * Uses k-anonymity to protect the password
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  if (!password || password.length < 4) {
    return { isBreached: false, count: 0 };
  }

  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "Add-Padding": "true", // Adds padding to prevent response length analysis
        },
      }
    );

    if (!response.ok) {
      console.warn("[password-breach] API request failed:", response.status);
      return { isBreached: false, count: 0, error: "API unavailable" };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return { isBreached: true, count };
      }
    }

    return { isBreached: false, count: 0 };
  } catch (error) {
    console.warn("[password-breach] Error checking password:", error);
    return { isBreached: false, count: 0, error: "Check failed" };
  }
}

/**
 * Debounced password breach check
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function checkPasswordBreachDebounced(
  password: string,
  callback: (result: BreachCheckResult) => void,
  delay: number = 500
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const result = await checkPasswordBreach(password);
    callback(result);
  }, delay);
}
