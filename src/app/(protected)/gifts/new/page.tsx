import { GiftForm } from "@/components/gift-form";

export default function NewGiftPage() {
  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">New gift</span>
          <h2>Save the memory while it is fresh</h2>
        </div>
      </div>
      <section className="card">
        <GiftForm mode="create" />
      </section>
    </div>
  );
}
