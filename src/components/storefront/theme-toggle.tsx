"use client";

import { useSyncExternalStore } from "react";

import { Moon, Sun } from "@/components/ui/icons";

const storageKey = "allure-storefront-theme";
const changeEvent = "allure-storefront-theme-change";

function currentTheme() {
  return document.documentElement.dataset.storefrontTheme === "light";
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey) return;
    if (event.newValue === "light") document.documentElement.dataset.storefrontTheme = "light";
    else delete document.documentElement.dataset.storefrontTheme;
    onChange();
  }
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, currentTheme, () => false);

  function toggle() {
    const next = !light;
    if (next) document.documentElement.dataset.storefrontTheme = "light";
    else delete document.documentElement.dataset.storefrontTheme;
    try {
      localStorage.setItem(storageKey, next ? "light" : "dark");
    } catch {
      // The visual switch still works when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <button
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={light}
      className="theme-toggle"
      onClick={toggle}
      title={light ? "Dark mode" : "Light mode"}
      type="button"
    >
      {light ? <Moon /> : <Sun />}
      <span>{light ? "Dark" : "Light"}</span>
    </button>
  );
}
