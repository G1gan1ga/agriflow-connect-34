import { Link } from "@tanstack/react-router";
import { Landmark, Languages, Sprout, ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";
import { LANGS, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="border-b-4 border-primary bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Landmark className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold leading-tight text-foreground sm:text-lg">
                {t("appName", lang)}
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {t("department", lang)}
              </span>
            </span>
          </Link>
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-input bg-background px-2 py-1.5">
            <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">{t("language", lang)}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="bg-transparent text-sm font-semibold text-foreground outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label="Main" className="mx-auto flex max-w-6xl gap-1 px-2 pb-2">
          <NavTab to="/farmer" icon={<Sprout className="h-4 w-4" aria-hidden />} label={t("farmerPortal", lang)} />
          <NavTab
            to="/officer"
            icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
            label={t("officerDashboard", lang)}
          />
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-5 pb-16">
        {children}
      </main>
      <footer className="border-t bg-card px-4 py-6 text-center text-xs text-muted-foreground">
        {t("ministry", lang)} · Government of India · Demo prototype with simulated data
      </footer>
    </div>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ "data-active": "true" }}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground",
        "hover:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
