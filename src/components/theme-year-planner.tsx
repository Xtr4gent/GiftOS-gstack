"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AvailableGift = {
  id: string;
  name: string;
  status: string;
  totalAmount: number;
  currencyCode: string;
  isPinned: boolean;
};

type OccasionOption = {
  type: string;
  slug: string;
  label: string;
};

type ThemeMonth = {
  monthNumber: number;
  slug: string;
  label: string;
  description: string;
  items: Array<
    | {
        id: string;
        kind: "linked";
        monthNumber: number;
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
        monthNumber: number;
        position: number;
        draftName: string | null;
        draftNotes: string | null;
        draftProductUrl: string | null;
        draftTargetAmount: number | null;
      }
  >;
};

type ThemeYearPlannerProps = {
  year: number;
  years: number[];
  themeYear: {
    id: string;
    year: number;
    name: string;
    description: string | null;
  };
  availableGifts: AvailableGift[];
  months: ThemeMonth[];
  occasionOptions: OccasionOption[];
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

export function ThemeYearPlanner({
  year,
  years,
  themeYear,
  availableGifts,
  months,
  occasionOptions,
}: ThemeYearPlannerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

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

  return (
    <div className="stack">
      <section className="hero-card hero-card--editorial">
        <div className="occasion-hero">
          <div>
            <span className="eyebrow">Yearly creative layer</span>
            <h2>{themeYear.name}</h2>
            <p>{themeYear.description || "Give the year a throughline, then let each month interpret it a little differently."}</p>
          </div>
          <div className="occasion-year-nav">
            <span className="eyebrow">Year</span>
            <div className="chip-row">
              {[...new Set([year, year - 1, year + 1, ...years])].sort((a, b) => b - a).slice(0, 6).map((candidateYear) => (
                <Link
                  key={candidateYear}
                  href={`/theme?year=${candidateYear}`}
                  prefetch={false}
                  className={`year-chip${candidateYear === year ? " year-chip--active" : ""}`}
                >
                  {candidateYear}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card stack">
        <div className="section-head">
          <div>
            <span className="eyebrow">Theme spine</span>
            <h3>Name the year</h3>
          </div>
          <p className="muted">This gives the whole year a point of view, while the monthly slots translate it into real ideas.</p>
        </div>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            runRequest("theme-save", () =>
              fetch(`/api/theme?year=${year}`, {
                method: "PATCH",
                body: formData,
              }),
            );
          }}
        >
          <div className="detail-grid">
            <label>
              Theme name
              <input name="name" defaultValue={themeYear.name} required />
            </label>
            <div />
            <label className="grid__full">
              Description
              <textarea
                name="description"
                defaultValue={themeYear.description ?? ""}
                rows={4}
                placeholder="A year of quiet luxury, handmade touches, cozy rituals, little surprises..."
              />
            </label>
          </div>
          <div className="button-row button-row--tight">
            <button type="submit" disabled={pending === "theme-save"}>
              {pending === "theme-save" ? "Saving..." : "Save theme"}
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="form__error">{error}</p> : null}

      {months.map((month) => (
        <section key={month.monthNumber} className="card stack">
          <div className="section-head">
            <div>
              <span className="eyebrow">Theme month</span>
              <h3>{month.label}</h3>
            </div>
            <p className="muted">{month.description}</p>
          </div>

          {month.items.length ? (
            <ul className="plain-list planner-list">
              {month.items.map((item) => (
                <li key={item.id} className="planner-item">
                  {item.kind === "linked" ? (
                    <div className="stack">
                      <form
                        className="planner-item__linked"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          runRequest(`${item.id}-save-month`, () =>
                            fetch(`/api/theme/items/${item.id}`, {
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
                            <Image
                              src={`/api/gift-images/${item.gift.imageId}`}
                              alt=""
                              className="thumb"
                              width={64}
                              height={64}
                              sizes="64px"
                              loading="lazy"
                              unoptimized
                            />
                          ) : (
                            <div className="thumb thumb--empty" />
                          )}
                          <div>
                            <Link href={`/gifts/${item.gift.id}`} prefetch={false} className="gift-row__title">
                              {item.gift.name}
                            </Link>
                            <p className="muted">{item.gift.status}</p>
                          </div>
                        </div>
                        <div className="planner-item__actions">
                          <strong>{formatMinorUnits(item.gift.totalAmount, item.gift.currencyCode)}</strong>
                          <label className="planner-lane-picker">
                            Month
                            <select name="monthNumber" defaultValue={String(item.monthNumber)}>
                              {months.map((monthOption) => (
                                <option key={monthOption.monthNumber} value={monthOption.monthNumber}>
                                  {monthOption.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="button-row button-row--tight">
                            <button type="submit" disabled={pending === `${item.id}-save-month`}>
                              {pending === `${item.id}-save-month` ? "Saving..." : "Save month"}
                            </button>
                            <button
                              type="button"
                              className="button-link button-link--quiet"
                              disabled={pending === `${item.id}-up`}
                              onClick={() =>
                                runRequest(`${item.id}-up`, () => {
                                  const formData = new FormData();
                                  formData.set("action", "move-up");
                                  return fetch(`/api/theme/items/${item.id}`, { method: "PATCH", body: formData });
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
                                  return fetch(`/api/theme/items/${item.id}`, { method: "PATCH", body: formData });
                                })
                              }
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              className="button-link button-link--quiet"
                              disabled={pending === `${item.id}-delete`}
                              onClick={() => runRequest(`${item.id}-delete`, () => fetch(`/api/theme/items/${item.id}`, { method: "DELETE" }))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </form>

                      <form
                        className="theme-assign-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          runRequest(`${item.id}-assign`, () =>
                            fetch(`/api/theme/items/${item.id}/assign`, {
                              method: "POST",
                              body: formData,
                            }),
                          );
                        }}
                      >
                        <span className="eyebrow">Upstream to occasions</span>
                        <label>
                          Occasion plan
                          <select name="occasionType" defaultValue="BIRTHDAY">
                            {occasionOptions.map((option) => (
                              <option key={option.type} value={option.type}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Target year
                          <input name="year" type="number" min="2000" max="2100" defaultValue={year} />
                        </label>
                        <button type="submit" disabled={pending === `${item.id}-assign`}>
                          {pending === `${item.id}-assign` ? "Assigning..." : "Assign to occasion"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <form
                      className="stack"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        runRequest(`${item.id}-save`, () =>
                          fetch(`/api/theme/items/${item.id}`, {
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
                          Month
                          <select name="monthNumber" defaultValue={String(item.monthNumber)}>
                            {months.map((monthOption) => (
                              <option key={monthOption.monthNumber} value={monthOption.monthNumber}>
                                {monthOption.label}
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
                              () => fetch(`/api/theme/items/${item.id}/promote`, { method: "POST" }),
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
                              return fetch(`/api/theme/items/${item.id}`, { method: "PATCH", body: formData });
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
                              return fetch(`/api/theme/items/${item.id}`, { method: "PATCH", body: formData });
                            })
                          }
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--quiet"
                          disabled={pending === `${item.id}-delete`}
                          onClick={() => runRequest(`${item.id}-delete`, () => fetch(`/api/theme/items/${item.id}`, { method: "DELETE" }))}
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
            <p className="muted">Nothing is parked in {month.label} yet. Link a saved gift or sketch a draft idea to give this month its version of the theme.</p>
          )}

          <div className="planner-add-grid">
            <form
              className="card card--nested stack"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runRequest(`${month.monthNumber}-link`, () =>
                  fetch(`/api/theme/items?year=${year}`, {
                    method: "POST",
                    body: formData,
                  }),
                );
                event.currentTarget.reset();
              }}
            >
              <input type="hidden" name="monthNumber" value={month.monthNumber} />
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
              <button type="submit" disabled={pending === `${month.monthNumber}-link`}>
                {pending === `${month.monthNumber}-link` ? "Adding..." : "Add saved gift"}
              </button>
            </form>

            <form
              className="card card--nested stack"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runRequest(`${month.monthNumber}-draft`, () =>
                  fetch(`/api/theme/items?year=${year}`, {
                    method: "POST",
                    body: formData,
                  }),
                );
                event.currentTarget.reset();
              }}
            >
              <input type="hidden" name="monthNumber" value={month.monthNumber} />
              <div>
                <span className="eyebrow">Quick add</span>
                <h4>Add a themed draft</h4>
              </div>
              <label>
                Draft name
                <input name="draftName" placeholder="Weekend away, framed note, little luxury..." required />
              </label>
              <label>
                Target amount
                <input name="draftTargetAmount" type="number" min="0" step="0.01" placeholder="0.00" />
              </label>
              <label>
                Product URL
                <input name="draftProductUrl" type="url" placeholder="https://..." />
              </label>
              <label>
                Notes
                <textarea name="draftNotes" rows={3} placeholder="How this month expresses the theme." />
              </label>
              <button type="submit" disabled={pending === `${month.monthNumber}-draft`}>
                {pending === `${month.monthNumber}-draft` ? "Adding..." : "Add draft idea"}
              </button>
            </form>
          </div>
        </section>
      ))}

      <section className="card">
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h3>Theme first, occasions second</h3>
          </div>
        </div>
        <p className="muted">
          Month items can stay loose while you explore the year. When one becomes real, promote it into the gift vault, then assign it into a birthday, anniversary, Christmas, or Valentine&apos;s plan if the timing fits.
        </p>
      </section>
    </div>
  );
}
