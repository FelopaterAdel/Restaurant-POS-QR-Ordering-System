import { Spinner } from "@/components/ui";
import { useRestaurant } from "@/features/settings/restaurant-context";
import { RestaurantProfileForm } from "@/features/settings/components/RestaurantProfileForm";
import { BrandingForm } from "@/features/settings/components/BrandingForm";
import { SettingsPreview } from "@/features/settings/components/SettingsPreview";
import "./settings.css";

export default function SettingsPage() {
  const { restaurant, isLoading, error } = useRestaurant();

  if (isLoading) {
    return (
      <div className="settings-page">
        <div className="settings-page__loading">
          <Spinner />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="settings-page__error">
          <p>Failed to load restaurant settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">
          Manage your restaurant profile and branding.
        </p>
      </div>

      <div className="settings-page__grid">
        <div className="settings-page__main">
          <RestaurantProfileForm restaurant={restaurant} />
          <BrandingForm restaurant={restaurant} />
        </div>
        <div className="settings-page__sidebar">
          <SettingsPreview restaurant={restaurant} />
        </div>
      </div>
    </div>
  );
}
