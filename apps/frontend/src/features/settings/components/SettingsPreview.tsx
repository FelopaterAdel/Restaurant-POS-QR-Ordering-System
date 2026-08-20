import type { Restaurant } from "../settings.types";

interface SettingsPreviewProps {
  restaurant: Restaurant | null;
}

export function SettingsPreview({ restaurant }: SettingsPreviewProps) {
  const primaryColor = restaurant?.primaryColor ?? "#059669";
  const restaurantName = restaurant?.name ?? "My Restaurant";

  return (
    <div className="settings-preview">
      <h2 className="settings-form__title">Preview</h2>
      <div className="settings-preview__card">
        <div
          className="settings-preview__header"
          style={{ backgroundColor: primaryColor }}
        >
          {restaurant?.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt="Logo"
              className="settings-preview__logo"
            />
          )}
          <span className="settings-preview__name">{restaurantName}</span>
        </div>
        <div className="settings-preview__body">
          <div className="settings-preview__row">
            <span className="settings-preview__label">Description</span>
            <span className="settings-preview__value">
              {restaurant?.description || "Not set"}
            </span>
          </div>
          <div className="settings-preview__row">
            <span className="settings-preview__label">Phone</span>
            <span className="settings-preview__value">
              {restaurant?.phone || "Not set"}
            </span>
          </div>
          <div className="settings-preview__row">
            <span className="settings-preview__label">Address</span>
            <span className="settings-preview__value">
              {restaurant?.address || "Not set"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
