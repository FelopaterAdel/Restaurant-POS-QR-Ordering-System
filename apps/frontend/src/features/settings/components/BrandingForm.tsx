import { useState } from "react";
import type { Restaurant, UpdateRestaurantInput } from "../settings.types";
import { useUpdateRestaurantMutation } from "../settings.mutations";

interface BrandingFormProps {
  restaurant: Restaurant | null;
}

const PRESET_COLORS = [
  "#059669",
  "#2563eb",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#4f46e5",
];

export function BrandingForm({ restaurant }: BrandingFormProps) {
  const [primaryColor, setPrimaryColor] = useState(
    restaurant?.primaryColor ?? "#059669",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    restaurant?.secondaryColor ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(restaurant?.logoUrl ?? "");

  const mutation = useUpdateRestaurantMutation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: UpdateRestaurantInput = {
      primaryColor,
      secondaryColor: secondaryColor.trim() || null,
      logoUrl: logoUrl.trim() || null,
    };
    mutation.mutate(input);
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-form__title">Branding</h2>
      <p className="settings-form__subtitle">
        Customize the look and feel of your POS.
      </p>

      <div className="settings-form__field">
        <label className="settings-form__label">Primary Color</label>
        <div className="branding__color-picker">
          <input
            type="color"
            className="branding__color-input"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
          <div className="branding__presets">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`branding__preset ${primaryColor === color ? "branding__preset--active" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setPrimaryColor(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          <span className="branding__hex">{primaryColor}</span>
        </div>
      </div>

      <div className="settings-form__field">
        <label className="settings-form__label">Secondary Color</label>
        <div className="branding__color-picker">
          <input
            type="color"
            className="branding__color-input"
            value={secondaryColor || "#f1f5f9"}
            onChange={(e) => setSecondaryColor(e.target.value)}
          />
          <button
            type="button"
            className="branding__clear"
            onClick={() => setSecondaryColor("")}
          >
            Clear
          </button>
          <span className="branding__hex">{secondaryColor || "Default"}</span>
        </div>
      </div>

      <div className="settings-form__field">
        <label className="settings-form__label" htmlFor="logo-url">
          Logo URL
        </label>
        <input
          id="logo-url"
          type="url"
          className="settings-form__input"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
        {logoUrl && (
          <div className="branding__logo-preview">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="branding__logo-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      <div className="settings-form__actions">
        <button
          type="submit"
          className="settings-form__submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Branding"}
        </button>
        {mutation.isError && (
          <span className="settings-form__error">
            Failed to save. Please try again.
          </span>
        )}
        {mutation.isSuccess && (
          <span className="settings-form__success">Saved successfully.</span>
        )}
      </div>
    </form>
  );
}
