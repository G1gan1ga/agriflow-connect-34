import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Circle,
  IndianRupee,
  Keypad,
  MessageSquare,
  PhoneCall,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Timer,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { STAGES, stageLabel, t } from "@/lib/i18n";
import {
  CENTERS,
  CROPS,
  SLOTS,
  todayISO,
  useApp,
  type Profile,
  type Booking,
} from "@/lib/store";
import {
  formatAadhaar,
  generateDemoAadhaar,
  sendAadhaarOtp,
  validateAadhaar,
  verifyAadhaarOtp,
} from "@/lib/aadhaar";
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

const TABS = ["profile", "bookSlot", "liveQueue", "payments", "smsBooking", "alerts"] as const;

function FarmerPage() {
  const { lang, activeBooking, profile, hasProfile } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("profile");

  // Auto-switch to live queue or booking if profile is already loaded
  useEffect(() => {
    if (activeBooking) {
      // Keep user choice or default
    }
  }, [activeBooking]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("farmerPortal", lang)}</h1>
          <p className="text-xs text-muted-foreground">
            Aadhaar e-KYC verified slot booking & real-time queue tracking
          </p>
        </div>

        {/* Status Indicator */}
        {hasProfile ? (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
            <User className="h-4 w-4 text-primary" />
            <span className="font-bold">{profile.name}</span>
            <span className="text-muted-foreground">({profile.farmerId.slice(-4)})</span>
            {profile.aadhaarVerified && (
              <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-black text-primary">
                <ShieldCheck className="h-3 w-3" /> e-KYC
              </span>
            )}
          </div>
        ) : (
          <span className="rounded-xl border border-dashed px-3 py-1 text-xs font-semibold text-muted-foreground">
            New session: Register or look up token below
          </span>
        )}
      </div>

      {/* Global Token / Farmer Switcher Bar */}
      <FarmerSwitcherBar onNavigateToQueue={() => setTab("liveQueue")} />

      {/* Navigation Tabs */}
      <div role="tablist" aria-label={t("farmerPortal", lang)} className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all",
              tab === k
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-input bg-card text-foreground hover:bg-accent",
            )}
          >
            {k === "smsBooking"
              ? "📱 " + t("smsBooking", lang)
              : t(k, lang)}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileForm onSaved={() => setTab("bookSlot")} />}
      {tab === "bookSlot" && <Booking onBooked={() => setTab("liveQueue")} />}
      {tab === "liveQueue" && <QueueTracker />}
      {tab === "payments" && <Pipeline />}
      {tab === "smsBooking" && <SmsFeaturePhoneSimulator onTrack={() => setTab("liveQueue")} />}
      {tab === "alerts" && <Alerts />}
    </div>
  );
}

/**
 * Top Toolbar allowing switching between farmers, starting a new registration,
 * or searching any token / Aadhaar so multiple farmers can be tracked separately.
 */
function FarmerSwitcherBar({ onNavigateToQueue }: { onNavigateToQueue: () => void }) {
  const { farmers, profile, switchFarmer, startNewRegistration, lookupTokenOrAadhaar, activeBooking } = useApp();
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="rounded-2xl border-2 bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Switch Demo Farmers:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {farmers.slice(0, 4).map((f) => (
              <button
                key={f.id}
                onClick={() => switchFarmer(f.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors",
                  profile.farmerId === f.aadhaar
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent",
                )}
              >
                {f.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-bold hover:bg-accent"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            Track Any Token
          </button>
          <button
            onClick={startNewRegistration}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground hover:opacity-90"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + New Farmer
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mt-3 flex gap-2 border-t pt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const res = lookupTokenOrAadhaar(query);
                if (res.found) onNavigateToQueue();
              }
            }}
            placeholder="Enter Token (e.g. KRN-101, T-104) or Aadhaar number..."
            className="flex-1 rounded-xl border-2 border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              const res = lookupTokenOrAadhaar(query);
              if (res.found) onNavigateToQueue();
            }}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
          >
            Track Status
          </button>
        </div>
      )}

      {activeBooking && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-accent/60 px-3 py-1.5 text-xs">
          <span className="font-semibold text-foreground">
            Currently Viewing Token: <strong className="font-black text-primary">{activeBooking.token}</strong> ({activeBooking.farmerName} · {activeBooking.slot})
          </span>
          <button
            onClick={onNavigateToQueue}
            className="font-bold text-primary underline hover:opacity-80"
          >
            View Live Queue →
          </button>
        </div>
      )}
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

function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const { lang, profile, hasProfile, saveProfile, notify } = useApp();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);

  // Aadhaar OTP & Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (hasProfile) setDraft(profile);
  }, [hasProfile, profile]);

  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));

  // Live Aadhaar Validation using Verhoeff Checksum
  const aadhaarCheck = useMemo(() => validateAadhaar(draft.farmerId), [draft.farmerId]);

  const handleAadhaarChange = (val: string) => {
    const formatted = formatAadhaar(val);
    set({ farmerId: formatted, aadhaarVerified: false });
  };

  const handleSendOtp = () => {
    const res = sendAadhaarOtp(draft.farmerId);
    if (!res.success) {
      notify(res.message, "App");
      return;
    }
    setGeneratedOtp(res.otp ?? "123456");
    setOtpMessage(res.message);
    setOtpError(null);
    setShowOtpModal(true);
    notify(`Simulated SMS: Your UIDAI OTP is ${res.otp}`, "SMS");
  };

  const handleVerifyOtp = () => {
    const res = verifyAadhaarOtp(draft.farmerId, otpInput);
    if (res.success) {
      set({ aadhaarVerified: true });
      setShowOtpModal(false);
      setOtpInput("");
      notify("Aadhaar e-KYC Verified Successfully via UIDAI Registry!", "App");
    } else {
      setOtpError(res.message);
    }
  };

  return (
    <form
      className="grid gap-4 rounded-2xl border-2 bg-card p-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!aadhaarCheck.isValid) {
          notify(aadhaarCheck.error || "Please enter a valid Aadhaar number before saving.", "App");
          return;
        }
        setSaving(true);
        await saveProfile(draft);
        setSaving(false);
        notify(t("saved", lang), "App");
        if (onSaved) onSaved();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <User className="h-5 w-5" aria-hidden /> {t("profile", lang)}
        </h2>
        <button
          type="button"
          onClick={() => {
            const demo = generateDemoAadhaar(Math.floor(20000000000 + Math.random() * 70000000000));
            set({ farmerId: demo, aadhaarVerified: true });
            notify("Generated valid Aadhaar with Verhoeff checksum.", "App");
          }}
          className="text-xs font-bold text-primary underline"
        >
          🎲 Auto-fill Valid Demo Aadhaar
        </button>
      </div>

      <Field label={t("name", lang)}>
        <input
          className={inputCls}
          value={draft.name}
          placeholder="e.g. Ramesh Yadav"
          onChange={(e) => set({ name: e.target.value })}
          required
        />
      </Field>

      {/* Aadhaar Field with Verhoeff Verification */}
      <div className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{t("farmerId", lang)}</span>
          {draft.aadhaarVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-4 w-4" /> {t("aadhaarVerified", lang)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">12-digit UIDAI format</span>
          )}
        </div>

        <div className="relative">
          <input
            className={cn(
              inputCls,
              aadhaarCheck.cleanNumber.length === 12 && !aadhaarCheck.isValid && "border-destructive focus:border-destructive",
              draft.aadhaarVerified && "border-primary bg-primary/5",
            )}
            value={draft.farmerId}
            maxLength={14}
            placeholder="XXXX-XXXX-XXXX"
            onChange={(e) => handleAadhaarChange(e.target.value)}
            required
          />
          {draft.aadhaarVerified && (
            <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-primary" />
          )}
        </div>

        {/* Validation Feedback & e-KYC Button */}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
          {aadhaarCheck.cleanNumber.length > 0 && !draft.aadhaarVerified && (
            <p
              className={cn(
                "text-xs font-semibold",
                aadhaarCheck.isValid ? "text-primary" : "text-destructive",
              )}
            >
              {aadhaarCheck.isValid ? "✓ Verhoeff Checksum Valid" : aadhaarCheck.error}
            </p>
          )}

          {aadhaarCheck.isValid && !draft.aadhaarVerified && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground hover:opacity-90"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {t("verifyAadhaar", lang)}
            </button>
          )}
        </div>
      </div>

      <Field label={t("mobile", lang)}>
        <input
          className={inputCls}
          value={draft.mobile}
          placeholder="e.g. 9812340001"
          onChange={(e) => set({ mobile: e.target.value })}
          inputMode="tel"
        />
      </Field>

      <Field label={t("village", lang)}>
        <input
          className={inputCls}
          value={draft.village}
          placeholder="e.g. Nissing"
          onChange={(e) => set({ village: e.target.value })}
        />
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
          value={draft.landSize || ""}
          placeholder="e.g. 5.2"
          onChange={(e) => set({ landSize: Number(e.target.value) })}
        />
      </Field>

      <Field label={t("center", lang)}>
        <select className={inputCls} value={draft.centerId} onChange={(e) => set({ centerId: e.target.value })}>
          {CENTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("quantity", lang)}>
        <input
          className={inputCls}
          type="number"
          value={draft.quantity || ""}
          placeholder="e.g. 25"
          onChange={(e) => set({ quantity: Number(e.target.value) })}
        />
      </Field>

      <button
        disabled={saving}
        className="rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:col-span-2"
      >
        {saving ? "Saving Profile…" : t("save", lang)}
      </button>

      {/* UIDAI OTP Verification Modal / Box */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-primary bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-foreground">UIDAI e-KYC Verification</h3>
                <p className="text-xs text-muted-foreground">National Identity Authentication Service</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border bg-muted p-3 text-xs">
              <p className="font-semibold text-foreground">{otpMessage}</p>
              <div className="mt-2 flex items-center justify-between rounded bg-background p-2 font-mono text-primary">
                <span>Simulated SMS OTP:</span>
                <span className="font-black tracking-widest">{generatedOtp}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-muted-foreground">Enter 6-digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="mt-1 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-center font-mono text-2xl font-black tracking-widest outline-none focus:border-primary"
              />
              {otpError && <p className="mt-1 text-xs font-bold text-destructive">{otpError}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOtpInput(generatedOtp || "123456")}
                className="rounded-xl border border-input px-3 py-2 text-xs font-bold hover:bg-accent"
              >
                Auto-fill
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground hover:opacity-90"
              >
                Confirm & Verify
              </button>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Booking({ onBooked }: { onBooked?: () => void }) {
  const { lang, profile, hasProfile, bookSlot, slotCount, activeBooking, cancelMyBooking } = useApp();
  const dates = [0, 1, 2, 3, 4].map((i) => todayISO(i));
  const [date, setDate] = useState(dates[0]!);
  const [slot, setSlot] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const center = CENTERS.find((c) => c.id === profile.centerId) ?? CENTERS[0]!;

  if (!hasProfile) {
    return (
      <Empty text="Fill in and save your farmer profile first with a verified Aadhaar to book a procurement slot." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <CalendarDays className="h-5 w-5" aria-hidden /> {t("bookSlot", lang)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {center.name} ({center.code}) · {profile.crop} · {profile.quantity} quintals · Aadhaar ending in {profile.farmerId.slice(-4)}
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
                  "w-20 shrink-0 rounded-xl border-2 p-3 text-center transition-all",
                  date === d ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-input bg-background",
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
                  "rounded-xl border-2 p-3 text-left transition-all",
                  isFull && "cursor-not-allowed border-input bg-muted opacity-60",
                  slot === s ? "border-primary bg-accent ring-2 ring-primary/40" : "border-input bg-background",
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
          disabled={!slot || bookingInProgress}
          onClick={async () => {
            if (!slot) return;
            setBookingInProgress(true);
            await bookSlot(date, slot);
            setBookingInProgress(false);
            if (onBooked) onBooked();
          }}
          className="mt-5 w-full rounded-xl bg-primary px-5 py-4 text-lg font-black text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {bookingInProgress ? "Generating Token…" : t("confirmBooking", lang)}
        </button>
      </div>

      {activeBooking && (
        <DigitalTokenCard booking={activeBooking} onCancel={cancelMyBooking} />
      )}
    </div>
  );
}

/**
 * Scannable Digital Token & Gate Pass Card
 */
function DigitalTokenCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const { lang } = useApp();
  const center = CENTERS.find((c) => c.id === booking.centerId);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-accent p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold uppercase text-primary">
            Official E-Token Gate Pass
          </span>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("yourToken", lang)}</p>
          <p className="text-4xl font-black text-foreground sm:text-5xl">{booking.token}</p>
          <p className="mt-1 text-sm font-semibold text-foreground/90">
            {booking.farmerName} · Aadhaar: {booking.farmerId.slice(-4)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {booking.date} · {booking.slot} · {center?.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {booking.crop} · Declared {booking.quantity} Quintals
          </p>
        </div>

        {/* QR Code Pass Representation */}
        <div className="flex flex-col items-center rounded-xl border bg-background p-3 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-lg bg-foreground text-background">
            <QrCode className="h-16 w-16" />
          </div>
          <span className="mt-1 font-mono text-[10px] font-bold text-muted-foreground">SCAN AT GATE</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-primary/20 pt-3">
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-black text-primary">
          Stage: {stageLabel(booking.stage, lang)}
        </span>
        {onCancel && (
          <button onClick={onCancel} className="text-xs font-bold text-destructive underline hover:opacity-80">
            Cancel booking
          </button>
        )}
      </div>
    </div>
  );
}

function QueueTracker() {
  const { lang, activeBooking, bookings, nowServing } = useApp();
  if (!activeBooking) return <Empty text={t("noBooking", lang)} />;

  const serving = nowServing[activeBooking.centerId];
  const centerBookings = bookings.filter((b) => b.centerId === activeBooking.centerId);

  const ahead = centerBookings.filter(
    (b) =>
      b.stage === "booked" &&
      b.token !== activeBooking.token &&
      b.slot.localeCompare(activeBooking.slot) <= 0,
  ).length;

  return (
    <div className="space-y-4">
      <DigitalTokenCard booking={activeBooking} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<Timer className="h-5 w-5" aria-hidden />} label={t("nowServing", lang)} value={serving ?? "—"} />
        <Stat icon={<Users className="h-5 w-5" aria-hidden />} label={t("aheadOfYou", lang)} value={String(ahead)} />
        <Stat
          icon={<Timer className="h-5 w-5" aria-hidden />}
          label={t("estWait", lang)}
          value={`${ahead * 12} ${t("minutes", lang)}`}
        />
      </div>

      <div className="rounded-2xl border-2 bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Live Center Queue</h2>
          <span className="text-xs font-semibold text-muted-foreground">Auto-updates via WebSockets</span>
        </div>
        <ul className="mt-3 divide-y">
          {centerBookings
            .sort((a, b) => a.slot.localeCompare(b.slot))
            .map((b) => {
              const isCurrent = b.token === activeBooking.token;
              return (
                <li key={b.id} className={cn("flex items-center justify-between gap-3 py-3", isCurrent && "bg-accent/40 px-2 rounded-lg")}>
                  <span className="min-w-0">
                    <span className={cn("block truncate font-bold", isCurrent ? "text-primary text-base font-black" : "text-foreground")}>
                      {b.token} · {isCurrent ? `${b.farmerName} (You)` : b.farmerName}
                    </span>
                    <span className="block text-xs text-muted-foreground">{b.slot} · {b.crop}</span>
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
              );
            })}
        </ul>
      </div>
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
  const { lang, activeBooking } = useApp();
  if (!activeBooking) return <Empty text={t("noBooking", lang)} />;
  const current = STAGES.indexOf(activeBooking.stage);

  return (
    <div className="rounded-2xl border-2 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <IndianRupee className="h-5 w-5" aria-hidden /> {t("pipeline", lang)}
          </h2>
          <p className="text-xs text-muted-foreground">
            Tracking Token <strong className="text-primary font-bold">{activeBooking.token}</strong> ({activeBooking.farmerName})
          </p>
        </div>
        <span className="rounded-lg bg-accent px-3 py-1 font-mono text-xs font-bold text-foreground">
          Current Stage: {stageLabel(activeBooking.stage, lang)}
        </span>
      </div>

      <ol className="mt-5 space-y-2">
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
                {s === "weighed" && activeBooking.weightQuintals && (
                  <span className="text-sm text-muted-foreground">{activeBooking.weightQuintals} quintals verified on weighbridge</span>
                )}
                {(s === "accepted" || s === "paid") && activeBooking.amount && (
                  <span className="text-sm font-semibold text-primary">
                    Payable: Rs {activeBooking.amount.toLocaleString("en-IN")} (MSP Rs 2,275/q)
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

/**
 * Interactive Feature-Phone / SMS Booking Simulator
 * Built for farmers without smartphones (Basic button phones via SMS & USSD)
 */
function SmsFeaturePhoneSimulator({ onTrack }: { onTrack: () => void }) {
  const { bookViaSms } = useApp();
  const [mobile, setMobile] = useState("9812345678");
  const [name, setName] = useState("Harphool Singh");
  const [centerId, setCenterId] = useState("c1");
  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState(30);
  const [bookingState, setBookingState] = useState<{
    booked: boolean;
    token?: string;
    slot?: string;
    message?: string;
  }>({ booked: false });
  const [isSending, setIsSending] = useState(false);

  const center = CENTERS.find((c) => c.id === centerId) ?? CENTERS[0]!;

  const handleSimulateSms = async () => {
    setIsSending(true);
    const res = await bookViaSms({
      mobile,
      name,
      centerId,
      crop,
      quantity,
    });
    setIsSending(false);
    if (res.success) {
      setBookingState({
        booked: true,
        token: res.token,
        slot: res.slot,
        message: res.message,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 bg-card p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-black text-foreground">Kisan SMS & Feature Phone Booking Gateway</h2>
            <p className="text-xs text-muted-foreground">
              Empowering farmers who don't own smartphones. Book via regular SMS to <strong>56161</strong> or toll-free IVR <strong>1800-KRISHI</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Simulator Controls */}
        <div className="rounded-2xl border-2 bg-card p-5">
          <h3 className="font-bold text-foreground">Simulate Inbound Farmer SMS</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Test what happens when a farmer sends a text message from a keypad/feature phone:
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Farmer Mobile Number</label>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-input bg-background p-2.5 text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Farmer Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-input bg-background p-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Procurement Center</label>
                <select
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-input bg-background p-2.5 text-sm"
                >
                  {CENTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Crop</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-input bg-background p-2.5 text-sm"
                >
                  {CROPS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Quantity (Quintals)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border-2 border-input bg-background p-2.5 text-sm font-mono"
              />
            </div>

            <div className="rounded-xl border bg-muted p-3">
              <span className="text-[11px] font-bold text-muted-foreground">Inbound SMS Syntax sent to 56161:</span>
              <p className="mt-1 font-mono text-xs font-black text-primary">
                BOOK {center.code} {crop.toUpperCase()} {quantity}Q
              </p>
            </div>

            <button
              onClick={handleSimulateSms}
              disabled={isSending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSending ? "Processing SMS Gateway…" : "📩 Simulate Send SMS"}
            </button>
          </div>
        </div>

        {/* Realistic Feature Phone Mockup UI */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-72 rounded-[36px] border-4 border-slate-700 bg-slate-900 p-4 shadow-2xl">
            {/* Handset Speaker */}
            <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-700" />

            {/* Handset Green LCD Screen */}
            <div className="mt-3 rounded-2xl border-2 border-emerald-900 bg-[#7db576] p-3 font-mono text-emerald-950 shadow-inner">
              <div className="flex items-center justify-between border-b border-emerald-950/20 pb-1 text-[10px] font-bold">
                <span>📶 AIRTEL 2G</span>
                <span>100% 🔋</span>
              </div>

              <div className="my-2 min-h-[140px] text-xs">
                {bookingState.booked ? (
                  <div className="space-y-2">
                    <p className="font-bold text-black">[SMS from 56161]</p>
                    <p className="text-[11px] leading-tight">
                      Krishi Setu: Aapka token <strong className="font-black text-emerald-950">{bookingState.token}</strong> book ho gaya hai.
                    </p>
                    <p className="text-[11px] leading-tight">
                      Mandi: {center.code} | Slot: {bookingState.slot}
                    </p>
                    <p className="text-[10px] italic">Kripya samay par tractor pahuchein.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold">mKisan SMS Sewa</p>
                    <p className="text-[11px]">Send: BOOK &lt;CENTER&gt; &lt;CROP&gt; &lt;QTY&gt;</p>
                    <p className="text-[10px] text-emerald-900/80">Press Send to simulate.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-emerald-950/20 pt-1 text-center text-[10px] font-bold">
                {bookingState.booked ? "1 Unread Message" : "Standby"}
              </div>
            </div>

            {/* Handset Keypad Buttons Mockup */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 px-2 text-center text-slate-300">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                <div key={k} className="rounded-lg bg-slate-800 py-1.5 text-xs font-black shadow">
                  {k}
                </div>
              ))}
            </div>
          </div>

          {bookingState.booked && (
            <button
              onClick={onTrack}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow"
            >
              Track Token {bookingState.token} in Live Queue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Alerts() {
  const { notifications } = useApp();
  return (
    <div className="rounded-2xl border-2 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
        <BellRing className="h-5 w-5" aria-hidden /> SMS & Push Notifications Log
      </h2>
      <ul className="mt-3 space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="flex gap-3 rounded-xl border bg-muted p-3">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-muted-foreground">
                {n.channel} Alert · {n.time}
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
