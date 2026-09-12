import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Circle,
  IndianRupee,
  MessageSquare,
  ShieldCheck,
  Timer,
  User,
  Users,
} from "lucide-react";
import { STAGES, stageLabel, t } from "@/lib/i18n";
import {
  CENTERS,
  CROPS,
  DEMO_OTP,
  SLOTS,
  isValidAadhaar,
  normalizeAadhaar,
  todayISO,
  useApp,
  type Profile,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer Portal — Slot Booking & Token Tracking | Krishi Setu" },
      {
        name: "description",
        content:
          "Register your farmer profile, book a procurement time slot, track your live token and follow payment progress.",
      },
      { property: "og:title", content: "Farmer Portal — Slot Booking & Token Tracking | Krishi Setu" },
      {
        property: "og:description",
        content: "Book a procurement slot, get a token and track weighing to payment in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FarmerPage,
});

const TABS = ["profile", "bookSlot", "payments", "alerts"] as const;

function AadhaarLogin() {
  const { login } = useApp();
  const [aadhaar, setAadhaar] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border-2 bg-card p-6">
      <h1 className="flex items-center gap-2 text-xl font-black text-foreground">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Aadhaar sign-in
      </h1>
      <p className="text-sm text-muted-foreground">
        Farmers sign in with their 12-digit Aadhaar number.
      </p>
      <Field label="Aadhaar number">
        <input
          className={inputCls}
          inputMode="numeric"
          maxLength={14}
          placeholder="1234 5678 9012"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
        />
      </Field>

      <button
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50"
        disabled={busy || !isValidAadhaar(aadhaar)}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const ok = await login(aadhaar);
          setBusy(false);
          if (!ok) setError("Please enter a valid 12-digit Aadhaar number.");
        }}
      >
        {busy ? "Signing in…" : "Continue"}
      </button>
      {error && <p className="text-sm font-bold text-destructive">{error}</p>}
    </div>
  );
}

function FarmerPage() {
  const { lang, isAuthenticated, aadhaar, logout } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("bookSlot");

  if (!isAuthenticated) return <AadhaarLogin />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-foreground">{t("farmerPortal", lang)}</h1>
        <span className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Aadhaar ••••{aadhaar?.slice(-4)}
          </span>
          <button onClick={logout} className="font-bold text-destructive underline">
            Sign out
          </button>
        </span>
      </div>
      <div role="tablist" aria-label={t("farmerPortal", lang)} className="flex gap-2 overflow-x-auto pb-1">
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

      {tab === "profile" && <ProfileForm />}
      {tab === "bookSlot" && <Booking />}
      {tab === "liveQueue" && <QueueTracker />}
      {tab === "payments" && <Pipeline />}
      {tab === "alerts" && <Alerts />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-input bg-background px-3 py-3 text-base text-foreground outline-none focus:border-primary";

function ProfileForm() {
  const { lang, profile, hasProfile, saveProfile, notify, aadhaar } = useApp();
  const [draft, setDraft] = useState<Profile>({ ...profile, farmerId: aadhaar ?? profile.farmerId });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (hasProfile) setDraft(profile);
    else if (aadhaar) setDraft((d) => ({ ...d, farmerId: aadhaar }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfile, profile.farmerId, aadhaar]);
  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <form
      className="grid gap-4 rounded-2xl border-2 bg-card p-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await saveProfile(draft);
        setSaving(false);
        notify(t("saved", lang), "App");
      }}
    >
      <h2 className="flex items-center gap-2 text-lg font-black text-foreground sm:col-span-2">
        <User className="h-5 w-5" aria-hidden /> {t("profile", lang)}
      </h2>
      <Field label={t("name", lang)}>
        <input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} required />
      </Field>
      <Field label={t("farmerId", lang)}>
        <input className={cn(inputCls, "bg-muted")} value={draft.farmerId} readOnly aria-readonly required />
      </Field>
      <Field label={t("mobile", lang)}>
        <input className={inputCls} value={draft.mobile} onChange={(e) => set({ mobile: e.target.value })} inputMode="tel" />
      </Field>
      <Field label={t("village", lang)}>
        <input className={inputCls} value={draft.village} onChange={(e) => set({ village: e.target.value })} />
      </Field>
      <Field label={t("crop", lang)}>
        <select className={inputCls} value={draft.crop} onChange={(e) => set({ crop: e.target.value })}>
          {CROPS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label={t("landSize", lang)}>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={draft.landSize}
          onChange={(e) => set({ landSize: Number(e.target.value) })}
        />
      </Field>
      <Field label={t("center", lang)}>
        <select className={inputCls} value={draft.centerId} onChange={(e) => set({ centerId: e.target.value })}>
          {CENTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("quantity", lang)}>
        <input
          className={inputCls}
          type="number"
          value={draft.quantity}
          onChange={(e) => set({ quantity: Number(e.target.value) })}
        />
      </Field>
      <button
        disabled={saving}
        className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60 sm:col-span-2"
      >
        {saving ? "Saving…" : t("save", lang)}
      </button>
    </form>
  );
}

function Booking() {
  const { lang, profile, hasProfile, bookSlot, slotCount, myBooking, cancelMyBooking } = useApp();
  const dates = [0, 1, 2, 3, 4].map((i) => todayISO(i));
  const [date, setDate] = useState(dates[0]!);
  const [slot, setSlot] = useState<string | null>(null);
  const center = CENTERS.find((c) => c.id === profile.centerId) ?? CENTERS[0]!;

  if (!hasProfile)
    return <Empty text="Fill in and save your farmer profile first — your details are needed to issue a token." />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <CalendarDays className="h-5 w-5" aria-hidden /> {t("bookSlot", lang)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {center.name} · {profile.crop} · {profile.quantity} quintals
        </p>

        <h3 className="mt-5 text-sm font-bold text-foreground">{t("pickDate", lang)}</h3>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => {
            const dd = new Date(`${d}T00:00:00`);
            return (
              <button
                key={d}
                onClick={() => {
                  setDate(d);
                  setSlot(null);
                }}
                aria-pressed={date === d}
                className={cn(
                  "w-20 shrink-0 rounded-xl border-2 p-3 text-center",
                  date === d ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
                )}
              >
                <span className="block text-xs font-semibold">
                  {dd.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="block text-xl font-black">{dd.getDate()}</span>
              </button>
            );
          })}
        </div>

        <h3 className="mt-5 text-sm font-bold text-foreground">{t("pickSlot", lang)}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SLOTS.map((s) => {
            const used = slotCount(center.id, date, s);
            const left = center.capacityPerSlot - used;
            const isFull = left <= 0;
            return (
              <button
                key={s}
                disabled={isFull}
                aria-pressed={slot === s}
                onClick={() => setSlot(s)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left",
                  isFull && "cursor-not-allowed border-input bg-muted opacity-60",
                  slot === s ? "border-primary bg-accent" : "border-input bg-background",
                )}
              >
                <span className="block text-base font-bold text-foreground">{s}</span>
                <span className={cn("text-sm font-semibold", isFull ? "text-destructive" : "text-primary")}>
                  {isFull ? t("full", lang) : `${left} ${t("slotsLeft", lang)}`}
                </span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!slot}
          onClick={() => slot && bookSlot(date, slot)}
          className="mt-5 w-full rounded-xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground disabled:opacity-50"
        >
          {t("confirmBooking", lang)}
        </button>
      </div>

      {myBooking && (
        <div className="rounded-2xl border-2 border-primary bg-accent p-5">
          <p className="text-sm font-bold text-accent-foreground">{t("yourToken", lang)}</p>
          <p className="text-4xl font-black text-foreground">{myBooking.token}</p>
          <p className="mt-1 text-sm text-foreground/80">
            {myBooking.date} · {myBooking.slot} · {CENTERS.find((c) => c.id === myBooking.centerId)?.name}
          </p>
          <button onClick={cancelMyBooking} className="mt-3 text-sm font-bold text-destructive underline">
            Cancel booking
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 bg-card p-4">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

function Pipeline() {
  const { lang, myBooking } = useApp();
  if (!myBooking) return <Empty text={t("noBooking", lang)} />;
  const current = STAGES.indexOf(myBooking.stage);

  return (
    <div className="rounded-2xl border-2 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
        <IndianRupee className="h-5 w-5" aria-hidden /> {t("pipeline", lang)}
      </h2>
      <ol className="mt-4 space-y-1">
        {STAGES.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s} className="flex gap-3">
              <span className="flex flex-col items-center">
                {done ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" aria-hidden />
                )}
                {i < STAGES.length - 1 && (
                  <span className={cn("h-8 w-1 rounded", done ? "bg-primary" : "bg-border")} />
                )}
              </span>
              <span className="pb-2">
                <span className={cn("block font-bold", done ? "text-foreground" : "text-muted-foreground")}>
                  {stageLabel(s, lang)}
                </span>
                {s === "weighed" && myBooking.weightQuintals && (
                  <span className="text-sm text-muted-foreground">{myBooking.weightQuintals} quintals recorded</span>
                )}
                {(s === "accepted" || s === "paid") && myBooking.amount && (
                  <span className="text-sm text-muted-foreground">
                    Rs {myBooking.amount.toLocaleString("en-IN")} at MSP Rs 2,275/quintal
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Alerts() {
  const { notifications } = useApp();
  return (
    <div className="rounded-2xl border-2 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
        <BellRing className="h-5 w-5" aria-hidden /> Notifications
      </h2>
      <ul className="mt-3 space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="flex gap-3 rounded-xl border bg-muted p-3">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-muted-foreground">
                {n.channel} · {n.time}
              </span>
              <span className="block text-sm text-foreground">{n.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border-2 border-dashed bg-card p-8 text-center text-muted-foreground">{text}</p>;
}
