"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type GiftFormProps = {
  mode: "create" | "edit";
  gift?: {
    id: string;
    name: string;
    notes: string | null;
    productUrl: string | null;
    storeName: string | null;
    currencyCode: string;
    basePriceAmount: number;
    taxAmount: number;
    shippingAmount: number;
    status: string;
    isPinned: boolean;
    isArchived: boolean;
    isOneOff: boolean;
    isWrapped: boolean;
    occasionType: string | null;
    occasionYear: number | null;
    purchasedAt: Date | null;
    receivedAt: Date | null;
    wrappedAt: Date | null;
    givenAt: Date | null;
    tags: string[];
  };
};

function currencyInput(value?: number | null) {
  if (!value) return "";
  return (value / 100).toFixed(2);
}

function dateInput(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function GiftForm({ mode, gift }: GiftFormProps) {
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

        const formData = new FormData(event.currentTarget);
        const url = mode === "create" ? "/api/gifts" : `/api/gifts/${gift?.id}`;
        const method = mode === "create" ? "POST" : "PATCH";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        setPending(false);

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Something went wrong." }));
          setError(payload.error || "Something went wrong.");
          return;
        }

        router.push(mode === "create" ? "/gifts" : `/gifts/${gift?.id}`);
        router.refresh();
      }}
    >
      <div className="grid">
        <label>
          Gift name
          <input name="name" defaultValue={gift?.name ?? ""} required />
        </label>
        <label>
          Store name
          <input name="storeName" defaultValue={gift?.storeName ?? ""} />
        </label>
        <label className="grid__full">
          Product URL
          <input name="productUrl" type="url" defaultValue={gift?.productUrl ?? ""} />
        </label>
        <label className="grid__full">
          Notes
          <textarea name="notes" defaultValue={gift?.notes ?? ""} rows={4} />
        </label>
        <label>
          Currency
          <input name="currencyCode" defaultValue={gift?.currencyCode ?? "USD"} maxLength={3} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={gift?.status ?? "IDEA"}>
            <option value="IDEA">Idea</option>
            <option value="PURCHASED">Purchased</option>
            <option value="RECEIVED">Received</option>
            <option value="GIVEN">Given</option>
          </select>
        </label>
        <label>
          Base price
          <input name="basePriceAmount" type="number" min="0" step="0.01" defaultValue={currencyInput(gift?.basePriceAmount)} />
        </label>
        <label>
          Tax
          <input name="taxAmount" type="number" min="0" step="0.01" defaultValue={currencyInput(gift?.taxAmount)} />
        </label>
        <label>
          Shipping
          <input
            name="shippingAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={currencyInput(gift?.shippingAmount)}
          />
        </label>
        <label>
          Occasion
          <select name="occasionType" defaultValue={gift?.occasionType ?? ""}>
            <option value="">None</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="ANNIVERSARY">Anniversary</option>
            <option value="CHRISTMAS">Christmas</option>
            <option value="VALENTINES">Valentine&apos;s Day</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Occasion year
          <input name="occasionYear" type="number" min="2000" max="2100" defaultValue={gift?.occasionYear ?? ""} />
        </label>
        <label>
          Purchased on
          <input name="purchasedAt" type="date" defaultValue={dateInput(gift?.purchasedAt)} />
        </label>
        <label>
          Received on
          <input name="receivedAt" type="date" defaultValue={dateInput(gift?.receivedAt)} />
        </label>
        <label>
          Wrapped on
          <input name="wrappedAt" type="date" defaultValue={dateInput(gift?.wrappedAt)} />
        </label>
        <label>
          Given on
          <input name="givenAt" type="date" defaultValue={dateInput(gift?.givenAt)} />
        </label>
        <label className="grid__full">
          Tags
          <input name="tags" defaultValue={gift?.tags.join(", ") ?? ""} placeholder="flowers, jewelry, cozy" />
        </label>
        <label className="grid__full">
          Image
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp" />
        </label>
      </div>
      <div className="checkbox-row">
        <label><input name="isPinned" type="checkbox" defaultChecked={gift?.isPinned ?? false} /> Pinned</label>
        <label><input name="isArchived" type="checkbox" defaultChecked={gift?.isArchived ?? false} /> Archived</label>
        <label><input name="isOneOff" type="checkbox" defaultChecked={gift?.isOneOff ?? false} /> One-off</label>
        <label><input name="isWrapped" type="checkbox" defaultChecked={gift?.isWrapped ?? false} /> Wrapped</label>
      </div>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row">
        <button type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Create gift" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
