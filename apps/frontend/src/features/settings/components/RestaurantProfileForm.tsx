import { useState } from "react";
import type { Restaurant, UpdateRestaurantInput } from "../settings.types";
import { useUpdateRestaurantMutation } from "../settings.mutations";

interface RestaurantProfileFormProps {
  restaurant: Restaurant | null;
}

export function RestaurantProfileForm({
  restaurant,
}: RestaurantProfileFormProps) {
  const [name, setName] = useState(restaurant?.name ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");

  const mutation = useUpdateRestaurantMutation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: UpdateRestaurantInput = {
      name: name.trim() || undefined,
      description: description.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    };
    mutation.mutate(input);
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h2 className="settings-form__title">Restaurant Profile</h2>
      <p className="settings-form__subtitle">
        Basic information about your restaurant.
      </p>

      <div className="settings-form__field">
        <label className="settings-form__label" htmlFor="restaurant-name">
          Name
        </label>
        <input
          id="restaurant-name"
          type="text"
          className="settings-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Restaurant name"
          required
        />
      </div>

      <div className="settings-form__field">
        <label className="settings-form__label" htmlFor="restaurant-description">
          Description
        </label>
        <textarea
          id="restaurant-description"
          className="settings-form__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description of your restaurant"
          rows={3}
        />
      </div>

      <div className="settings-form__row">
        <div className="settings-form__field">
          <label className="settings-form__label" htmlFor="restaurant-phone">
            Phone
          </label>
          <input
            id="restaurant-phone"
            type="tel"
            className="settings-form__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="settings-form__field">
          <label className="settings-form__label" htmlFor="restaurant-address">
            Address
          </label>
          <input
            id="restaurant-address"
            type="text"
            className="settings-form__input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
          />
        </div>
      </div>

      <div className="settings-form__actions">
        <button
          type="submit"
          className="settings-form__submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Profile"}
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
