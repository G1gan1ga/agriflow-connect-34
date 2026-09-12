import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "./i18n";
import { STAGES, type Stage } from "./i18n";

export type Center = {
  id: string;
  name: string;
  district: string;
  capacityPerSlot: number;
};

export type Booking = {
  id: string;
  token: string;
  farmerName: string;
  farmerId: string;
  village: string;
  crop: string;
  quantity: number;
  centerId: string;
  date: string; // yyyy-mm-dd
  slot: string;
  stage: Stage;
  weightQuintals?: number | undefined;
  amount?: number | undefined;
  isMe?: boolean | undefined;
};

export type Notification = {
  id: string;
  channel: "SMS" | "App";
  text: string;
  time: string;
};

export type Profile = {
  farmerId: string; // Aadhaar / Farmer ID
  name: string;
  village: string;
  mobile: string;
  crop: string;
  landSize: number;
  centerId: string;
  quantity: number;
};

export const CENTERS: Center[] = [
  { id: "c1", name: "Mandi Samiti, Karnal", district: "Karnal, Haryana", capacityPerSlot: 6 },
  { id: "c2", name: "APMC Yard, Ludhiana", district: "Ludhiana, Punjab", capacityPerSlot: 5 },
  { id: "c3", name: "FCI Depot, Bhopal", district: "Bhopal, Madhya Pradesh", capacityPerSlot: 4 },
];

export const CROPS = ["Wheat", "Paddy", "Mustard", "Gram", "Maize"];

export const SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
];

export const MSP = 2275;

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function clock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const EMPTY_PROFILE: Profile = {
  farmerId: "",
  name: "",
  village: "",
  mobile: "",
  crop: "Wheat",
  landSize: 0,
  centerId: "c1",
  quantity: 0,
};

const AUTH_KEY = "krishi-setu-aadhaar";

export const DEMO_OTP = "123456";

export function normalizeAadhaar(v: string) {
  return v.replace(/\D/g, "");
}

export function isValidAadhaar(v: string) {
  return /^\d{12}$/.test(normalizeAadhaar(v));
}

type FarmerRow = {
  id: string;
  name: string;
  aadhaar: string;
  mobile: string | null;
  village: string | null;
  crop: string;
  land_size: number;
  center_id: string;
  quantity: number;
};

type BookingRow = {
  id: string;
  farmer_id: string;
  center_id: string;
  booking_date: string;
  slot: string;
  crop: string;
  quantity: number;
  token: string | null;
  stage: string;
  weight_quintals: number | null;
  amount: number | null;
  updated_at: string;
};

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  loading: boolean;
  profile: Profile;
  hasProfile: boolean;
  saveProfile: (p: Profile) => Promise<void>;
  bookings: Booking[];
  myBooking?: Booking | undefined;
  notifications: Notification[];
  nowServing: Record<string, string>;
  bookSlot: (date: string, slot: string) => Promise<void>;
  cancelMyBooking: () => Promise<void>;
  advance: (id: string) => Promise<void>;
  setWeight: (id: string, weight: number) => Promise<void>;
  callNext: (centerId: string) => Promise<void>;
  slotCount: (centerId: string, date: string, slot: string) => number;
  notify: (text: string, channel?: "SMS" | "App") => void;
};

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [myFarmerId, setMyFarmerId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", channel: "SMS", text: "Procurement center Karnal is open 08:00-15:00 today.", time: "07:10" },
    { id: "n2", channel: "App", text: `MSP for Wheat is Rs ${MSP} per quintal this season.`, time: "07:12" },
  ]);

  const notify = useCallback((text: string, channel: "SMS" | "App" = "SMS") => {
    setNotifications((n) => [
      { id: `n${Date.now()}${Math.round(Math.random() * 999)}`, channel, text, time: clock() },
      ...n,
    ]);
  }, []);

  const load = useCallback(async () => {
    const [f, b] = await Promise.all([
      supabase.from("farmers").select("*").order("created_at"),
      supabase.from("bookings").select("*").order("token_no"),
    ]);
    if (f.data) setFarmers(f.data as FarmerRow[]);
    if (b.data) setRows(b.data as BookingRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMyFarmerId(localStorage.getItem(ME_KEY));
    void load();
    const channel = supabase
      .channel("krishi-setu")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const farmerById = useMemo(() => new Map(farmers.map((f) => [f.id, f])), [farmers]);

  const me = myFarmerId ? farmerById.get(myFarmerId) : undefined;

  const profile: Profile = me
    ? {
        farmerId: me.aadhaar,
        name: me.name,
        village: me.village ?? "",
        mobile: me.mobile ?? "",
        crop: me.crop,
        landSize: Number(me.land_size),
        centerId: me.center_id,
        quantity: Number(me.quantity),
      }
    : EMPTY_PROFILE;

  const bookings: Booking[] = useMemo(
    () =>
      rows.map((r) => {
        const f = farmerById.get(r.farmer_id);
        return {
          id: r.id,
          token: r.token ?? "—",
          farmerName: f?.name ?? "Farmer",
          farmerId: f?.aadhaar ?? "",
          village: f?.village ?? "",
          crop: r.crop,
          quantity: Number(r.quantity),
          centerId: r.center_id,
          date: r.booking_date,
          slot: r.slot,
          stage: (STAGES as readonly string[]).includes(r.stage) ? (r.stage as Stage) : "booked",
          weightQuintals: r.weight_quintals == null ? undefined : Number(r.weight_quintals),
          amount: r.amount == null ? undefined : Number(r.amount),
          isMe: myFarmerId != null && r.farmer_id === myFarmerId,
        };
      }),
    [rows, farmerById, myFarmerId],
  );

  const myBooking = useMemo(() => bookings.find((b) => b.isMe), [bookings]);

  const nowServing = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of [...rows].sort((a, b) => a.updated_at.localeCompare(b.updated_at))) {
      if (r.stage !== "booked" && r.token) out[r.center_id] = r.token;
    }
    return out;
  }, [rows]);

  const slotCount = useCallback(
    (centerId: string, date: string, slot: string) =>
      rows.filter((r) => r.center_id === centerId && r.booking_date === date && r.slot === slot).length,
    [rows],
  );

  const saveProfile = useCallback(
    async (p: Profile) => {
      const payload = {
        name: p.name,
        aadhaar: p.farmerId,
        mobile: p.mobile,
        village: p.village,
        crop: p.crop,
        land_size: p.landSize,
        center_id: p.centerId,
        quantity: p.quantity,
      };
      const { data, error } = await supabase
        .from("farmers")
        .upsert(payload, { onConflict: "aadhaar" })
        .select()
        .single();
      if (error) {
        notify(`Could not save profile: ${error.message}`, "App");
        return;
      }
      const row = data as FarmerRow;
      localStorage.setItem(ME_KEY, row.id);
      setMyFarmerId(row.id);
      await load();
    },
    [load, notify],
  );

  const bookSlot = useCallback(
    async (date: string, slot: string) => {
      if (!me) {
        notify("Please save your farmer profile before booking a slot.", "App");
        return;
      }
      await supabase.from("bookings").delete().eq("farmer_id", me.id);
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          farmer_id: me.id,
          center_id: me.center_id,
          booking_date: date,
          slot,
          crop: me.crop,
          quantity: me.quantity,
          stage: "booked",
        })
        .select()
        .single();
      if (error) {
        notify(`Booking failed: ${error.message}`, "App");
        return;
      }
      const row = data as BookingRow;
      notify(
        `Token ${row.token} confirmed for ${slot} on ${date} at ${
          CENTERS.find((c) => c.id === me.center_id)?.name
        }. Carry your Farmer ID.`,
      );
      await load();
    },
    [me, load, notify],
  );

  const cancelMyBooking = useCallback(async () => {
    if (!me) return;
    await supabase.from("bookings").delete().eq("farmer_id", me.id);
    notify("Your slot booking has been cancelled.", "App");
    await load();
  }, [me, load, notify]);

  const advance = useCallback(
    async (id: string) => {
      const r = rows.find((x) => x.id === id);
      if (!r) return;
      const i = STAGES.indexOf(r.stage as Stage);
      if (i < 0 || i >= STAGES.length - 1) return;
      const stage = STAGES[i + 1]!;
      const weight = r.weight_quintals ?? Math.max(1, Number(r.quantity) - 0.4);
      const patch: { stage: string; weight_quintals?: number; amount?: number } = { stage };
      if (stage === "weighed") patch.weight_quintals = weight;
      if (stage === "accepted") patch.amount = Math.round(weight * MSP);
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) {
        notify(`Update failed: ${error.message}`, "App");
        return;
      }
      if (myFarmerId && r.farmer_id === myFarmerId) {
        const amount = Math.round(weight * MSP).toLocaleString("en-IN");
        const msg: Record<Stage, string> = {
          booked: "Slot booked.",
          checked_in: `Token ${r.token} checked in at the gate.`,
          weighed: `Weighbridge recorded ${weight} quintals for token ${r.token}.`,
          quality: `Quality check passed for token ${r.token}.`,
          accepted: `Procurement accepted. Payable amount Rs ${amount}.`,
          paid: `Payment of Rs ${amount} credited to your bank account.`,
        };
        notify(msg[stage]);
      }
      await load();
    },
    [rows, myFarmerId, load, notify],
  );

  const setWeight = useCallback(
    async (id: string, weight: number) => {
      const r = rows.find((x) => x.id === id);
      const patch: { weight_quintals: number; stage?: string } = { weight_quintals: weight };
      if (r && STAGES.indexOf(r.stage as Stage) < 2) patch.stage = "weighed";
      await supabase.from("bookings").update(patch).eq("id", id);
      await load();
    },
    [rows, load],
  );

  const callNext = useCallback(
    async (centerId: string) => {
      const waiting = rows
        .filter((r) => r.center_id === centerId && r.stage === "booked")
        .sort((a, b) => a.slot.localeCompare(b.slot));
      const next = waiting[0];
      if (!next) {
        notify("No waiting tokens at this center.", "App");
        return;
      }
      await advance(next.id);
      if (myFarmerId && next.farmer_id === myFarmerId) {
        notify(`Your token ${next.token} is being called. Please proceed to the gate.`, "App");
      }
    },
    [rows, advance, myFarmerId, notify],
  );

  const value: Store = {
    lang,
    setLang,
    loading,
    profile,
    hasProfile: Boolean(me),
    saveProfile,
    bookings,
    myBooking,
    notifications,
    nowServing,
    bookSlot,
    cancelMyBooking,
    advance,
    setWeight,
    callNext,
    slotCount,
    notify,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
