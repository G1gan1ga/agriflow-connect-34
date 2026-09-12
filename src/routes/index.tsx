import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, IndianRupee, QrCode, Sprout, ClipboardCheck, ShieldCheck } from "lucide-react";
import { t } from "@/lib/i18n";
import { useApp, CENTERS } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Krishi Setu — Procurement Booking & Live Queue" },
      {
        name: "description",
        content:
          "Book crop procurement slots, track your live token queue and follow payment status with the Department of Consumer Affairs.",
      },
      { property: "og:title", content: "Krishi Setu — Procurement Booking & Live Queue" },
      {
        property: "og:description",
        content: "Slot booking, live token tracking and faster payments for farmers at procurement centers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { lang, bookings, nowServing } = useApp();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-primary/20 bg-accent p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-wide text-accent-foreground">
          {t("ministry", lang)}
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">
          {t("appName", lang)}
        </h1>
        <p className="mt-3 max-w-xl text-base text-foreground/80">{t("tagline", lang)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/farmer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground hover:opacity-90"
          >
            <Sprout className="h-5 w-5" aria-hidden />
            {t("farmerPortal", lang)}
          </Link>
          <Link
            to="/officer"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-background px-5 py-3 text-base font-bold text-primary hover:bg-accent"
          >
            <ClipboardCheck className="h-5 w-5" aria-hidden />
            {t("officerDashboard", lang)}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Feature icon={<QrCode className="h-6 w-6" aria-hidden />} title="Token on booking" body="Every confirmed slot gives a token number, so arrival time is planned, not guessed." />
        <Feature icon={<Clock className="h-6 w-6" aria-hidden />} title="Live queue" body="See who is being served now and how long the wait is before leaving the village." />
        <Feature icon={<IndianRupee className="h-6 w-6" aria-hidden />} title="Payment tracking" body="Follow weighing, quality check, acceptance and credit of MSP payment in one place." />
      </section>

      <section>
        <h2 className="text-xl font-black text-foreground">Procurement centers today</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CENTERS.map((c) => {
            const booked = bookings.filter((b) => b.centerId === c.id).length;
            return (
              <div key={c.id} className="rounded-xl border-2 bg-card p-4">
                <h3 className="font-bold text-foreground">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.district}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted p-2">
                    <dt className="text-xs text-muted-foreground">{t("nowServing", lang)}</dt>
                    <dd className="text-lg font-black text-foreground">{nowServing[c.id] ?? "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <dt className="text-xs text-muted-foreground">Booked today</dt>
                    <dd className="text-lg font-black text-foreground">{booked}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      <p className="flex items-center gap-2 rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
        Demonstration prototype. Aadhaar numbers are masked and all data shown is simulated.
      </p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border-2 bg-card p-5">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
      <h3 className="mt-3 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
