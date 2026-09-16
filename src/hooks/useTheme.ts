import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

/** Matches the key read by the inline resolver in index.html. */
const STORAGE_KEY = "mmun:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    // Private browsing can throw on access, not just on write.
    return "system";
  }
}

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Theme preference, persisted per device.
 *
 * "system" is stored as the absence of a key rather than the string "system",
 * so a delegate who never touches the toggle keeps following their phone even
 * if the default ever changes.
 */
export function useTheme(): {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (next: ThemePreference) => void;
} {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolve(readStoredPreference()));

  const apply = useCallback((next: ThemePreference) => {
    const theme = resolve(next);
    document.documentElement.dataset.theme = theme;
    setResolved(theme);
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      apply(next);
      try {
        if (next === "system") localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Preference just won't survive a reload; the page still switches.
      }
    },
    [apply],
  );

  // Keep following the OS while the preference is "system".
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference, apply]);

  return { preference, resolved, setPreference };
}
