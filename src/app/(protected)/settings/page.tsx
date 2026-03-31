import { SettingsForm } from "@/components/settings-form";
import { requireUserSession } from "@/lib/auth";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireUserSession();
  const [settingsRow, preferencesRow] = await Promise.all([
    db.query.settings.findFirst({ where: (settings, { eq }) => eq(settings.userId, session.user.id) }),
    db.query.preferences.findFirst({ where: (preferences, { eq }) => eq(preferences.userId, session.user.id) }),
  ]);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Dates, sizes, preferences</h2>
        </div>
      </div>
      <section className="card">
        <SettingsForm settings={settingsRow} preferences={preferencesRow} />
      </section>
    </div>
  );
}
