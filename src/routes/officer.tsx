import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, ChevronRight, DoorOpen, ScanLine, Scale, Search } from "lucide-react";
import { STAGES, stageLabel, t } from "@/lib/i18n";
import { CENTERS, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer")({
  head: () => ({
    meta: [
      { title: "Procurement Officer Dashboard — Token & Weighbridge | Kisan Slot" },
      {
        name: "description",
        content:
          "Verify farmer tokens, log weighbridge readings, manage the gate queue and review procurement center analytics.",
      },
      { property: "og:title", content: "Procurement Officer Dashboard" },
      {
        property: "og:description",
        content: "Token check-in, weighbridge logging, queue control and center analytics in one screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OfficerPage,
});

const TABS = ["verifyToken", "weighbridge", "gateQueue", "analytics"] as const;

function OfficerPage() {
  const { lang } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("gateQueue");
  const [centerId, setCenterId] = useState(CENTERS[0]!.id);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h1 className="truncate text-2xl font-black text-foreground">{t("officerDashboard", lang)}</h1>
        <select
          value={centerId}
          onChange={(e) => setCenterId(e.target.value)}
          aria-label={t("center", lang)}
          className="shrink-0 rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-bold"
        >
          {CENTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold",
              tab === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-accent",
            )}
          >
            {t(k, lang)}
          </button>
        ))}
      </div>

      {tab === "verifyToken" && <Verify centerId={centerId} />}
      {tab === "weighbridge" && <Weighbridge centerId={centerId} />}
      {tab === "gateQueue" && <Gate centerId={centerId} />}
      {tab === "analytics" && <Analytics centerId={centerId} />}
    </div>
  );
}

function Verify({ centerId }: { centerId: string }) {
  const { lang, bookings, advance, notify } = useApp();
  const [q, setQ] = useState("");
  const match = bookings.find((b) => b.centerId === centerId && b.token.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <ScanLine className="h-5 w-5" aria-hidden /> {t("verifyToken", lang)}
        </h2>
        <div className="mt-3 flex gap-2">
          <span className="flex flex-1 items-center gap-2 rounded-xl border-2 border-input bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter token e.g. T-104"
              aria-label="Token number"
              className="w-full bg-transparent py-3 text-base outline-none"
            />
          </span>
        </div>
        {q && !match && <p className="mt-3 font-bold text-destructive">No token found at this center.</p>}
        {match && (
          <div className="mt-4 rounded-xl border-2 border-primary bg-accent p-4">
            <p className="text-2xl font-black text-foreground">{match.token}</p>
            <p className="text-sm text-foreground/80">
              {match.farmerName} · {match.village} · {match.farmerId}
            </p>
            <p className="text-sm text-foreground/80">
              {match.crop} · {match.quantity} quintals · {match.slot}
            </p>
            <p className="mt-2 text-sm font-bold text-primary">{stageLabel(match.stage, lang)}</p>
            <button
              onClick={() => {
                advance(match.id);
                notify(`Officer checked in ${match.token}.`, "App");
              }}
              disabled={match.stage !== "booked"}
              className="mt-3 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50"
            >
              {t("verifyToken", lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Weighbridge({ centerId }: { centerId: string }) {
  const { lang, bookings, setWeight, advance } = useApp();
  const rows = bookings.filter((b) => b.centerId === centerId && STAGES.indexOf(b.stage) >= 1);

  return (
    <div className="rounded-2xl border-2 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
        <Scale className="h-5 w-5" aria-hidden /> {t("weighbridge", lang)}
      </h2>
      {rows.length === 0 && <p className="mt-3 text-muted-foreground">No checked-in trolleys yet.</p>}
      <ul className="mt-3 divide-y">
        {rows.map((b) => (
          <li key={b.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">
                {b.token} · {b.farmerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {b.crop} · declared {b.quantity} q · {stageLabel(b.stage, lang)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <input
                type="number"
                step="0.1"
                defaultValue={b.weightQuintals ?? ""}
                placeholder="Net q"
                aria-label={`Weight for ${b.token}`}
                onBlur={(e) => e.target.value && setWeight(b.id, Number(e.target.value))}
                className="w-24 rounded-lg border-2 border-input bg-background px-2 py-2 text-base"
              />
              <button
                onClick={() => advance(b.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
              >
                {t("advance", lang)} <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Gate({ centerId }: { centerId: string }) {
  const { lang, bookings, nowServing, callNext } = useApp();
  const rows = bookings.filter((b) => b.centerId === centerId).sort((a, b) => a.slot.localeCompare(b.slot));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="rounded-2xl border-2 border-primary bg-primary p-5 text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">{t("nowServing", lang)}</p>
          <p className="text-5xl font-black">{nowServing[centerId] ?? "—"}</p>
        </div>
        <button
          onClick={() => callNext(centerId)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-background px-6 py-5 text-lg font-black text-primary hover:bg-accent"
        >
          <DoorOpen className="h-5 w-5" aria-hidden />
          {t("callNext", lang)}
        </button>
      </div>

      <div className="rounded-2xl border-2 bg-card p-5">
        <h2 className="text-lg font-black text-foreground">{t("gateQueue", lang)}</h2>
        <ul className="mt-3 divide-y">
          {rows.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block truncate font-bold text-foreground">
                  {b.token} · {b.farmerName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {b.slot} · {b.crop} · {b.quantity} q
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                  b.stage === "paid" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {stageLabel(b.stage, lang)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Analytics({ centerId }: { centerId: string }) {
  const { lang, bookings } = useApp();
  const rows = bookings.filter((b) => b.centerId === centerId);
  const totalQ = rows.reduce((s, b) => s + (b.weightQuintals ?? 0), 0);
  const paid = rows.filter((b) => b.stage === "paid").length;
  const pending = rows.filter((b) => b.stage !== "paid").length;
  const amount = rows.reduce((s, b) => s + (b.amount ?? 0), 0);

  const byStage = STAGES.map((s) => ({ s, n: rows.filter((b) => b.stage === s).length }));
  const max = Math.max(1, ...byStage.map((x) => x.n));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Tokens today" value={String(rows.length)} />
        <Kpi label="Quintals weighed" value={totalQ.toFixed(1)} />
        <Kpi label="Payments done" value={`${paid}/${rows.length}`} />
        <Kpi label="Value processed" value={`Rs ${amount.toLocaleString("en-IN")}`} />
      </div>
      <div className="rounded-2xl border-2 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <BarChart3 className="h-5 w-5" aria-hidden /> {t("analytics", lang)}
        </h2>
        <ul className="mt-4 space-y-3">
          {byStage.map(({ s, n }) => (
            <li key={s} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3">
              <span className="truncate text-sm font-bold text-foreground">{stageLabel(s, lang)}</span>
              <span className="h-3 rounded-full bg-muted">
                <span className="block h-3 rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right text-sm font-black text-foreground">{n}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          {pending} tokens still in progress. Average handling time 12 minutes per trolley.
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}
