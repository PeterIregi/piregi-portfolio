"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const THEME_KEY = "theme";
const subscribers = new Set<() => void>();

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function emit() {
  for (const listener of subscribers) listener();
}

function setTheme(next: Theme) {
  localStorage.setItem(THEME_KEY, next);
  document.documentElement.classList.toggle("dark", next === "dark");
  emit();
}

function subscribe(onStoreChange: () => void) {
  // Apply the stored or system scheme the first time a listener signs up —
  // once, after hydration — so a dark preference saved on a light-OS machine
  // takes effect even though the media query alone would not have applied it.
  // The state itself comes from getSnapshot, so there is no state to force
  // into sync and no hydration mismatch: the initializer reading localStorage
  // would render differently on the server than on the client (#34).
  document.documentElement.classList.toggle("dark", getCurrentTheme() === "dark");
  subscribers.add(onStoreChange);
  return () => {
    subscribers.delete(onStoreChange);
  };
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, getServerSnapshot);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="gap-2"
    >
      {theme === "light" ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707-.707M12 7a5 5 0 1010 0 5 5 0 00-10 0z" />
        </svg>
      )}
    </Button>
  );
}