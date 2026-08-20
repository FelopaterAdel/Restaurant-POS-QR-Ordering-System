const CSS_VAR_MAP: Record<string, string> = {
  primaryColor: "--color-primary",
  secondaryColor: "--color-secondary",
};

function deriveHoverColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const factor = 0.85;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

function deriveSubtleColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r} ${g} ${b} / 0.08)`;
}

function deriveFocusRingColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r} ${g} ${b} / 0.35)`;
}

export interface BrandingConfig {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function applyBranding(config: BrandingConfig): void {
  const root = document.documentElement;

  if (config.primaryColor) {
    root.style.setProperty("--color-primary", config.primaryColor);
    root.style.setProperty("--color-primary-hover", deriveHoverColor(config.primaryColor));
    root.style.setProperty("--color-primary-subtle", deriveSubtleColor(config.primaryColor));
    root.style.setProperty("--color-focus-ring", deriveFocusRingColor(config.primaryColor));
  }

  if (config.secondaryColor) {
    root.style.setProperty("--color-secondary", config.secondaryColor);
    root.style.setProperty("--color-secondary-hover", deriveHoverColor(config.secondaryColor));
  }
}

export function resetBranding(): void {
  const root = document.documentElement;
  Object.values(CSS_VAR_MAP).forEach((varName) => {
    root.style.removeProperty(varName);
  });
  root.style.removeProperty("--color-primary-hover");
  root.style.removeProperty("--color-primary-subtle");
  root.style.removeProperty("--color-focus-ring");
  root.style.removeProperty("--color-secondary-hover");
}
