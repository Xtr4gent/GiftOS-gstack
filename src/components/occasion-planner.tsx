"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PlannerSummaryPanel } from "@/components/planner-summary-panel";
import { buildPlannerSummary } from "@/lib/planner-summary";

type AvailableGift = {
  id: string;
  name: string;
  status: string;
  totalAmount: number;
  currencyCode: string;
  isPinned: boolean;
};

type PlannerSection = {
  key: string;
  label: string;
  description: string;
  emptyState?: string;
  quickAddTitle?: string;
  quickAddDescription?: string;
  quickAddMode?: string;
  quickAddSubmitLabel?: string;
  summaryLabel?: string;
  items: Array<
    | {
        id: string;
        kind: "linked";
        sectionKey: string;
        position: number;
        gift: {
          id: string;
          name: string;
          status: string;
          totalAmount: number;
          currencyCode: string;
          productUrl: string | null;
          imageId: string | null;
        };
      }
    | {
        id: string;
        kind: "draft";
        sectionKey: string;
        position: number;
        draftName: string | null;
        draftNotes: string | null;
        draftProductUrl: string | null;
        draftTargetAmount: number | null;
      }
  >;
};

type OccasionPlannerProps = {
  typeSlug: string;
  year: number;
  plan: {
    id: string;
    year: number;
    themeName: string | null;
  };
  config: {
    label: string;
    eyebrow: string;
    description: string;
    plannerHeadline: string;
    addDraftLabel: string;
    plannerVariant: "default" | "christmas" | "birthday" | "valentines";
  };
  years: number[];
  availableGifts: AvailableGift[];
  sections: PlannerSection[];
  guide: {
    anniversaryNumber: number | null;
    traditional: string;
    modern: string;
    gemstone: string;
  } | null;
  recommendationHints: Array<{
    type: string;
    title: string;
    reason: string;
  }>;
};

function formatMinorUnits(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100);
}

function targetAmountInput(amount: number | null) {
  if (!amount) return "";
  return (amount / 100).toFixed(2);
}

export function OccasionPlanner({
  typeSlug,
  year,
  plan,
  config,
  years,
  availableGifts,
  sections,
  guide,
  recommendationHints,
}: OccasionPlannerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const plannerSummary = buildPlannerSummary({
    variant: config.plannerVariant,
    themeName: plan.themeName,
    sections: sections.map((section) => ({
      key: section.key,
      label: section.label,
      itemCount: section.items.length,
    })),
  });

  async function runRequest(key: string, request: () => Promise<Response>, onSuccess?: (response: Response) => Promise<void> | void) {
    setPending(key);
    setError(null);

    const response = await request();
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Something went wrong." }));
      setError(payload.error || "Something went wrong.");
      setPending(null);
      return;
    }

    if (onSuccess) {
      await onSuccess(response);
    }

    setPending(null);
    router.refresh();
  }

  function renderLinkForm(section: PlannerSection) {
    return (
      <form
        className="card card--nested stack planner-add-card planner-add-card--vault"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          runRequest(`${section.key}-link`, () =>
            fetch(`/api/occasions/${typeSlug}/items?year=${year}`, {
              method: "POST",
              body: formData,
            }),
          );
          event.currentTarget.reset();
        }}
      >
        <input type="hidden" name="sectionKey" value={section.key} />
        <div>
          <span className="eyebrow">From gift vault</span>
          <h4>Add an existing gift</h4>
        </div>
        <label>
          Saved gift
          <select name="giftId" defaultValue="">
            <option value="">Choose a saved gift</option>
            {availableGifts.map((gift) => (
              <option key={gift.id} value={gift.id}>
                {gift.name} - {gift.status} - {formatMinorUnits(gift.totalAmount, gift.currencyCode)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending === `${section.key}-link`}>
          {pending === `${section.key}-link` ? "Adding..." : "Add saved gift"}
        </button>
      </form>
    );
  }

  function renderDraftForm(section: PlannerSection) {
    return (
      <form
        className="card card--nested stack planner-add-card planner-add-card--primary"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          runRequest(`${section.key}-draft`, () =>
            fetch(`/api/occasions/${typeSlug}/items?year=${year}`, {
              method: "POST",
              body: formData,
            }),
          );
          event.currentTarget.reset();
        }}
      >
        <input type="hidden" name="sectionKey" value={section.key} />
        <div>
          <span className="eyebrow">Quick add</span>
          <h4>{section.quickAddTitle ?? config.addDraftLabel}</h4>
        </div>
        <label>
          Draft name
          <input
            name="draftName"
            placeholder={
              section.quickAddMode === "simple"
                ? "Lip balm, cozy socks, favorite candy..."
                : "Spa set, weekend getaway, handwritten note..."
            }
            required
          />
        </label>
        <label>
          Target amount
          <input name="draftTargetAmount" type="number" min="0" step="0.01" placeholder="0.00" />
        </label>
        {section.quickAddMode !== "simple" ? (
          <>
            <label>
              Product URL
              <input name="draftProductUrl" type="url" placeholder="https://..." />
            </label>
            <label>
              Notes
              <textarea
                name="draftNotes"
                rows={3}
                placeholder="Anything you want to remember while the idea is fresh."
              />
            </label>
          </>
        ) : (
          <>
            <input type="hidden" name="draftProductUrl" value="" />
            <input type="hidden" name="draftNotes" value="" />
            <p className="muted">
              Use this faster lane for little ideas that do not need much explanation yet.
            </p>
          </>
        )}
        <button type="submit" disabled={pending === `${section.key}-draft`}>
          {pending === `${section.key}-draft`
            ? "Adding..."
            : section.quickAddSubmitLabel ?? "Add draft idea"}
        </button>
      </form>
    );
  }

  return (
    <div className="stack">
      <section className="hero-card hero-card--editorial">
        <div className="occasion-hero">
          <div>
            <span className="eyebrow">{config.eyebrow}</span>
            <h2>{config.label} {year}</h2>
            <p>{config.description}</p>
          </div>
          <div className="occasion-year-nav">
            <span className="eyebrow">Year</span>
            <div className="chip-row">
              {[...new Set([year, year - 1, year + 1, ...years])].sort((a, b) => b - a).slice(0, 6).map((candidateYear) => (
                <Link
                  key={candidateYear}
                  href={`/occasions/${typeSlug}?year=${candidateYear}`}
                  className={`year-chip${candidateYear === year ? " year-chip--active" : ""}`}
                >
                  {candidateYear}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {guide ? (
        <section className="card occasion-guide">
          <div className="section-head">
            <div>
              <span className="eyebrow">Anniversary guide</span>
              <h3>{guide.anniversaryNumber ? `${guide.anniversaryNumber} year tradition` : "Guide not fully unlocked yet"}</h3>
            </div>
          </div>
          <div className="card-grid card-grid--guide">
            <article className="card card--nested">
              <span className="eyebrow">Traditional</span>
              <h4>{guide.traditional}</h4>
            </article>
            <article className="card card--nested">
              <span className="eyebrow">Modern</span>
              <h4>{guide.modern}</h4>
            </article>
            <article className="card card--nested">
              <span className="eyebrow">Gemstone</span>
              <h4>{guide.gemstone}</h4>
            </article>
          </div>
        </section>
      ) : null}

      {plannerSummary ? (
        <PlannerSummaryPanel summary={plannerSummary}>
          {config.plannerVariant === "birthday" ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runRequest("birthday-theme-save", () =>
                  fetch(`/api/occasions/${typeSlug}?year=${year}`, {
                    method: "PATCH",
                    body: formData,
                  }),
                );
              }}
            >
              <div className="detail-grid">
                <label className="grid__full">
                  Birthday theme
                  <input
                    name="themeName"
                    defaultValue={plan.themeName ?? ""}
                    placeholder="Cozy self-care, weekend away, little luxuries, garden romance..."
                  />
                </label>
              </div>
              <div className="button-row button-row--tight">
                <button type="submit" disabled={pending === "birthday-theme-save"}>
                  {pending === "birthday-theme-save" ? "Saving..." : "Save birthday theme"}
                </button>
              </div>
            </form>
          ) : null}
        </PlannerSummaryPanel>
      ) : null}

      {recommendationHints.length ? (
        <section className="card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Recommendation hints</span>
              <h3>What the planner is noticing</h3>
            </div>
          </div>
          <div className="recommendation-grid">
            {recommendationHints.map((hint) => (
              <article key={`${hint.type}-${hint.title}`} className="recommendation-card">
                <span className="eyebrow">{hint.type.replace("-", " ")}</span>
                <h4>{hint.title}</h4>
                <p className="muted">{hint.reason}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <p className="form__error">{error}</p> : null}

      {sections.map((section) => (
        <section
          key={section.key}
          className={`card stack${
            config.plannerVariant === "christmas"
              ? " planner-section planner-section--christmas"
              : config.plannerVariant === "birthday"
                ? " planner-section planner-section--birthday"
                : config.plannerVariant === "valentines"
                  ? " planner-section planner-section--valentines"
                : ""
          }`}
        >
          <div className="section-head planner-section__header">
            <div className="planner-section__title">
              <span className="eyebrow">{config.label}</span>
              <div className="planner-section__heading-row">
                <h3>{section.label}</h3>
                <span className="planner-section__count">{section.items.length}</span>
              </div>
            </div>
            <p className="muted">{section.description}</p>
          </div>

          {section.quickAddDescription ? <p className="planner-section__note">{section.quickAddDescription}</p> : null}

          {section.items.length ? (
            <ul className="plain-list planner-list">
              {section.items.map((item) => (
                <li key={item.id} className="planner-item">
                  {item.kind === "linked" ? (
                    <form
                      className="planner-item__linked"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        runRequest(`${item.id}-save-lane`, () =>
                          fetch(`/api/occasions/${typeSlug}/items/${item.id}`, {
                            method: "PATCH",
                            body: formData,
                          }),
                        );
                      }}
                    >
                      <input type="hidden" name="draftName" value="" />
                      <input type="hidden" name="draftNotes" value="" />
                      <input type="hidden" name="draftProductUrl" value="" />
                      <input type="hidden" name="draftTargetAmount" value="" />
                      <div className="gift-row__main">
                        {item.gift.imageId ? (
                          <img src={`/api/gift-images/${item.gift.imageId}`} alt="" className="thumb" />
                        ) : (
                          <div className="thumb thumb--empty" />
                        )}
                        <div>
                          <Link href={`/gifts/${item.gift.id}`} className="gift-row__title">
                            {item.gift.name}
                          </Link>
                          <p className="muted">{item.gift.status}</p>
                        </div>
                      </div>
                      <div className="planner-item__actions">
                        <strong>{formatMinorUnits(item.gift.totalAmount, item.gift.currencyCode)}</strong>
                        <label className="planner-lane-picker">
                          Lane
                          <select name="sectionKey" defaultValue={item.sectionKey}>
                            {sections.map((sectionOption) => (
                              <option key={sectionOption.key} value={sectionOption.key}>
                                {sectionOption.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="button-row button-row--tight">
                          <button type="submit" disabled={pending === `${item.id}-save-lane`}>
                            {pending === `${item.id}-save-lane` ? "Saving..." : "Save lane"}
                          </button>
                          <button
                            type="button"
                            className="button-link button-link--quiet"
                            disabled={pending === `${item.id}-up`}
                            onClick={() =>
                              runRequest(`${item.id}-up`, () => {
                                const formData = new FormData();
                                formData.set("action", "move-up");
                                return fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "PATCH", body: formData });
                              })
                            }
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="button-link button-link--quiet"
                            disabled={pending === `${item.id}-down`}
                            onClick={() =>
                              runRequest(`${item.id}-down`, () => {
                                const formData = new FormData();
                                formData.set("action", "move-down");
                                return fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "PATCH", body: formData });
                              })
                            }
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="button-link button-link--quiet"
                            disabled={pending === `${item.id}-delete`}
                            onClick={() =>
                              runRequest(`${item.id}-delete`, () => fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "DELETE" }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <form
                      className="stack"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        runRequest(`${item.id}-save`, () =>
                          fetch(`/api/occasions/${typeSlug}/items/${item.id}`, {
                            method: "PATCH",
                            body: formData,
                          }),
                        );
                      }}
                    >
                      <div className="detail-grid">
                        <label>
                          Draft idea
                          <input name="draftName" defaultValue={item.draftName ?? ""} required />
                        </label>
                        <label>
                          Lane
                          <select name="sectionKey" defaultValue={item.sectionKey}>
                            {sections.map((sectionOption) => (
                              <option key={sectionOption.key} value={sectionOption.key}>
                                {sectionOption.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Target amount
                          <input
                            name="draftTargetAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={targetAmountInput(item.draftTargetAmount)}
                          />
                        </label>
                        <label className="grid__full">
                          Product URL
                          <input name="draftProductUrl" type="url" defaultValue={item.draftProductUrl ?? ""} />
                        </label>
                        <label className="grid__full">
                          Notes
                          <textarea name="draftNotes" defaultValue={item.draftNotes ?? ""} rows={3} />
                        </label>
                      </div>
                      <div className="button-row button-row--tight">
                        <button type="submit" disabled={pending === `${item.id}-save`}>
                          {pending === `${item.id}-save` ? "Saving..." : "Save draft"}
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--quiet"
                          disabled={pending === `${item.id}-promote`}
                          onClick={() =>
                            runRequest(
                              `${item.id}-promote`,
                              () => fetch(`/api/occasions/${typeSlug}/items/${item.id}/promote`, { method: "POST" }),
                              async (response) => {
                                const payload = await response.json();
                                if (payload.giftId) {
                                  router.push(`/gifts/${payload.giftId}`);
                                }
                              },
                            )
                          }
                        >
                          Promote to gift
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--quiet"
                          disabled={pending === `${item.id}-up`}
                          onClick={() =>
                            runRequest(`${item.id}-up`, () => {
                              const formData = new FormData();
                              formData.set("action", "move-up");
                              return fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "PATCH", body: formData });
                            })
                          }
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--quiet"
                          disabled={pending === `${item.id}-down`}
                          onClick={() =>
                            runRequest(`${item.id}-down`, () => {
                              const formData = new FormData();
                              formData.set("action", "move-down");
                              return fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "PATCH", body: formData });
                            })
                          }
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--quiet"
                          disabled={pending === `${item.id}-delete`}
                          onClick={() =>
                            runRequest(`${item.id}-delete`, () => fetch(`/api/occasions/${typeSlug}/items/${item.id}`, { method: "DELETE" }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="planner-section__empty">
              {section.emptyState ?? "This section is empty right now. Add a saved gift or sketch a draft idea below."}
            </p>
          )}

          <div className="planner-add-grid">
            {config.plannerVariant === "christmas" ||
            config.plannerVariant === "birthday" ||
            config.plannerVariant === "valentines" ? (
              <>
                {renderDraftForm(section)}
                {renderLinkForm(section)}
              </>
            ) : (
              <>
                {renderLinkForm(section)}
                {renderDraftForm(section)}
              </>
            )}
          </div>
        </section>
      ))}

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Planner headline</span>
            <h3>{config.plannerHeadline}</h3>
          </div>
        </div>
        <p className="muted">
          Drafts stay inside this planner until they prove themselves. Promoting one creates a real gift record and links it back here.
        </p>
      </section>
    </div>
  );
}
