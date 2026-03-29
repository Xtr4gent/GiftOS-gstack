"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SettingsFormProps = {
  settings?: {
    birthdayMonth?: number | null;
    birthdayDay?: number | null;
    anniversaryMonth?: number | null;
    anniversaryDay?: number | null;
    anniversaryStartYear?: number | null;
    timezone: string;
    defaultCurrencyCode: string;
  } | null;
  preferences?: {
    ringSize?: string | null;
    braceletSize?: string | null;
    necklaceLength?: string | null;
    shoeSize?: string | null;
    clothingSize?: string | null;
    favoriteColors?: string[];
    favoriteBrands?: string[];
    doNotBuyItems?: string[];
    wishCategories?: string[];
  } | null;
};

export function SettingsForm({ settings, preferences }: SettingsFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const response = await fetch("/api/settings", {
          method: "PUT",
          body: new FormData(event.currentTarget),
        });

        setPending(false);

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Could not save settings." }));
          setError(payload.error || "Could not save settings.");
          return;
        }

        router.refresh();
      }}
    >
      <div className="grid">
        <label>
          Birthday month
          <input name="birthdayMonth" type="number" min="1" max="12" defaultValue={settings?.birthdayMonth ?? ""} />
        </label>
        <label>
          Birthday day
          <input name="birthdayDay" type="number" min="1" max="31" defaultValue={settings?.birthdayDay ?? ""} />
        </label>
        <label>
          Anniversary month
          <input
            name="anniversaryMonth"
            type="number"
            min="1"
            max="12"
            defaultValue={settings?.anniversaryMonth ?? ""}
          />
        </label>
        <label>
          Anniversary day
          <input name="anniversaryDay" type="number" min="1" max="31" defaultValue={settings?.anniversaryDay ?? ""} />
        </label>
        <label>
          Anniversary start year
          <input
            name="anniversaryStartYear"
            type="number"
            min="1900"
            max="2100"
            defaultValue={settings?.anniversaryStartYear ?? ""}
          />
        </label>
        <label>
          Timezone
          <input name="timezone" defaultValue={settings?.timezone ?? "America/Toronto"} />
        </label>
        <label>
          Default currency
          <input name="defaultCurrencyCode" defaultValue={settings?.defaultCurrencyCode ?? "USD"} maxLength={3} />
        </label>
        <label>
          Ring size
          <input name="ringSize" defaultValue={preferences?.ringSize ?? ""} />
        </label>
        <label>
          Bracelet size
          <input name="braceletSize" defaultValue={preferences?.braceletSize ?? ""} />
        </label>
        <label>
          Necklace length
          <input name="necklaceLength" defaultValue={preferences?.necklaceLength ?? ""} />
        </label>
        <label>
          Shoe size
          <input name="shoeSize" defaultValue={preferences?.shoeSize ?? ""} />
        </label>
        <label>
          Clothing size
          <input name="clothingSize" defaultValue={preferences?.clothingSize ?? ""} />
        </label>
        <label className="grid__full">
          Favorite colors
          <input name="favoriteColors" defaultValue={preferences?.favoriteColors?.join(", ") ?? ""} />
        </label>
        <label className="grid__full">
          Favorite brands
          <input name="favoriteBrands" defaultValue={preferences?.favoriteBrands?.join(", ") ?? ""} />
        </label>
        <label className="grid__full">
          Absolutely not items
          <input name="doNotBuyItems" defaultValue={preferences?.doNotBuyItems?.join(", ") ?? ""} />
        </label>
        <label className="grid__full">
          Wish categories
          <input name="wishCategories" defaultValue={preferences?.wishCategories?.join(", ") ?? ""} />
        </label>
      </div>
      {error ? <p className="form__error">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
