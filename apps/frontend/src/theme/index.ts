export { theme } from "./tokens";
export type { Theme } from "./tokens";

export type ThemeMode = "light" | "dark";

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}

export function getPreferredTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function initTheme(): void {
  applyTheme(getPreferredTheme());
}
