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
import { generateDemoAadhaar, validateAadhaar } from "./aadhaar";

export type Center = {
  id: string;
  name: string;
  district: string;
  code: string;
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
  aadhaarVerified?: boolean;
};

export const CENTERS: Center[] = [
  { id: "c1", name: "Mandi Samiti, Karnal", district: "Karnal, Haryana", code: "KRN", capacityPerSlot: 6 },
  { id: "c2", name: "APMC Yard, Ludhiana", district: "Ludhiana, Punjab", code: "LDH", capacityPerSlot: 5 },
  { id: "c3", name: "FCI Depot, Bhopal", district: "Bhopal, Madhya Pradesh", code: "BPL", capacityPerSlot: 4 },
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
  aadhaarVerified: false,
};

const ME_KEY = "krishi-setu-farmer-id";

export type FarmerRow = {
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

export type BookingRow = {
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
  farmers: FarmerRow[];
  bookings: Booking[];
  myBooking?: Booking | undefined;
  activeBooking?: Booking | undefined;
  trackedBookingId: string | null;
  setTrackedBookingId: (id: string | null) => void;
  notifications: Notification[];
  nowServing: Record<string, string>;
  bookSlot: (date: string, slot: string) => Promise<void>;
  cancelMyBooking: () => Promise<void>;
  advance: (id: string) => Promise<void>;
  setWeight: (id: string, weight: number) => Promise<void>;
  callNext: (centerId: string) => Promise<void>;
  slotCount: (centerId: string, date: string, slot: string) => number;
  notify: (text: string, channel?: "SMS" | "App") => void;
  // Multi-Farmer and Token Switching
  switchFarmer: (farmerId: string) => void;
  startNewRegistration: () => void;
  lookupTokenOrAadhaar: (query: string) => { found: boolean; booking?: Booking; farmer?: FarmerRow };
  // SMS / Feature-Phone Booking Engine
  bookViaSms: (params: {
    mobile: string;
    centerId: string;
    crop: string;
    quantity: number;
    name?: string;
    village?: string;
  }) => Promise<{ success: boolean; token?: string; slot?: string; message: string }>;
};

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [myFarmerId, setMyFarmerId] = useState<string | null>(null);
  const [trackedBookingId, setTrackedBookingId] = useState<string | null>(null);
  const [verifiedAadhaars, setVerifiedAadhaars] = useState<Record<string, boolean>>({});

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", channel: "SMS", text: "Procurement center Karnal is open 08:00-15:00 today.", time: "07:10" },
    { id: "n2", channel: "App", text: `MSP for Wheat is Rs ${MSP} per quintal this season.`, time: "07:12" },
    { id: "n3", channel: "SMS", text: "Kisan SMS Sewa: Feature phone booking active via 1800-KRISHI.", time: "07:15" },
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
    const savedId = localStorage.getItem(ME_KEY);
    if (savedId) setMyFarmerId(savedId);
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
        aadhaarVerified: Boolean(verifiedAadhaars[me.aadhaar] || me.aadhaar.length === 14 || me.aadhaar.length === 12),
      }
    : EMPTY_PROFILE;

  const bookings: Booking[] = useMemo(
    () =>
      rows.map((r) => {
        const f = farmerById.get(r.farmer_id);
        const center = CENTERS.find((c) => c.id === r.center_id);
        const centerPrefix = center?.code ?? "MND";
        // Format token with smart prefix if just a number
        const rawToken = r.token ?? `T-${r.token_no ?? 100}`;
        const smartToken = rawToken.startsWith("T-") ? `${centerPrefix}-${rawToken.slice(2)}` : rawToken;

        return {
          id: r.id,
          token: smartToken,
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

  // Active booking for tracking (defaults to myBooking, or explicitly tracked token)
  const activeBooking = useMemo(() => {
    if (trackedBookingId) {
      return bookings.find((b) => b.id === trackedBookingId) ?? myBooking;
    }
    return myBooking;
  }, [trackedBookingId, bookings, myBooking]);

  const nowServing = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of [...rows].sort((a, b) => a.updated_at.localeCompare(b.updated_at))) {
      if (r.stage !== "booked" && r.token) {
        const center = CENTERS.find((c) => c.id === r.center_id);
        const prefix = center?.code ?? "MND";
        const smart = r.token.startsWith("T-") ? `${prefix}-${r.token.slice(2)}` : r.token;
        out[r.center_id] = smart;
      }
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
      setTrackedBookingId(null);
      if (p.aadhaarVerified) {
        setVerifiedAadhaars((prev) => ({ ...prev, [p.farmerId]: true }));
      }
      await load();
    },
    [load, notify],
  );

  // Switch to an existing farmer profile
  const switchFarmer = useCallback(
    (farmerId: string) => {
      localStorage.setItem(ME_KEY, farmerId);
      setMyFarmerId(farmerId);
      setTrackedBookingId(null);
      const f = farmers.find((x) => x.id === farmerId);
      if (f) {
        notify(`Switched active profile to ${f.name}.`, "App");
      }
    },
    [farmers, notify],
  );

  // Clear current active session so another person can register independently
  const startNewRegistration = useCallback(() => {
    localStorage.removeItem(ME_KEY);
    setMyFarmerId(null);
    setTrackedBookingId(null);
    notify("Ready for new farmer registration. Please fill details.", "App");
  }, [notify]);

  // Lookup any token or Aadhaar number to view separate tracking status
  const lookupTokenOrAadhaar = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return { found: false };

      // Check bookings by token
      const foundBooking = bookings.find(
        (b) =>
          b.token.toLowerCase() === q ||
          b.token.toLowerCase().replace(/[^a-z0-9]/g, "") === q.replace(/[^a-z0-9]/g, ""),
      );

      if (foundBooking) {
        setTrackedBookingId(foundBooking.id);
        const f = farmers.find((x) => x.aadhaar === foundBooking.farmerId);
        if (f) setMyFarmerId(f.id);
        notify(`Tracking loaded for Token ${foundBooking.token} (${foundBooking.farmerName})`, "App");
        return { found: true, booking: foundBooking, farmer: f };
      }

      // Check farmers by Aadhaar or Mobile
      const cleanDigits = q.replace(/\D/g, "");
      const foundFarmer = farmers.find(
        (f) =>
          f.aadhaar.replace(/\D/g, "") === cleanDigits ||
          (f.mobile && f.mobile.replace(/\D/g, "") === cleanDigits),
      );

      if (foundFarmer) {
        setMyFarmerId(foundFarmer.id);
        const b = bookings.find((x) => x.farmerId === foundFarmer.aadhaar);
        if (b) setTrackedBookingId(b.id);
        notify(`Profile loaded for ${foundFarmer.name} (Aadhaar ending in ${foundFarmer.aadhaar.slice(-4)})`, "App");
        return { found: true, booking: b, farmer: foundFarmer };
      }

      notify(`No booking or registered farmer found for "${query}".`, "App");
      return { found: false };
    },
    [bookings, farmers, notify],
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
      const center = CENTERS.find((c) => c.id === me.center_id);
      const displayToken = `${center?.code ?? "MND"}-${row.token_no ?? row.token?.replace("T-", "") ?? "100"}`;
      notify(
        `Token ${displayToken} confirmed for ${slot} on ${date} at ${center?.name}. Carry your Farmer ID.`,
      );
      setTrackedBookingId(row.id);
      await load();
    },
    [me, load, notify],
  );

  // SMS Booking for Farmers without Smartphones
  const bookViaSms = useCallback(
    async (params: {
      mobile: string;
      centerId: string;
      crop: string;
      quantity: number;
      name?: string;
      village?: string;
    }) => {
      const cleanMobile = params.mobile.replace(/\D/g, "");
      const center = CENTERS.find((c) => c.id === params.centerId) ?? CENTERS[0]!;
      const farmerName = params.name?.trim() || `Kisan (${cleanMobile.slice(-4)})`;
      const village = params.village?.trim() || "Rural Center";

      // Check if farmer exists by mobile
      let farmer = farmers.find((f) => f.mobile && f.mobile.replace(/\D/g, "") === cleanMobile);

      if (!farmer) {
        const dummyAadhaar = generateDemoAadhaar(Number(cleanMobile) || 28417712120);
        const { data: newF, error: fErr } = await supabase
          .from("farmers")
          .upsert({
            name: farmerName,
            aadhaar: dummyAadhaar,
            mobile: cleanMobile,
            village,
            crop: params.crop,
            land_size: 3.5,
            center_id: center.id,
            quantity: params.quantity,
          }, { onConflict: "aadhaar" })
          .select()
          .single();

        if (fErr || !newF) {
          return { success: false, message: fErr?.message || "SMS Registration failed" };
        }
        farmer = newF as FarmerRow;
      }

      // Find earliest available slot today
      const today = todayISO(0);
      let selectedSlot = SLOTS[0]!;
      for (const s of SLOTS) {
        const count = rows.filter((r) => r.center_id === center.id && r.booking_date === today && r.slot === s).length;
        if (count < center.capacityPerSlot) {
          selectedSlot = s;
          break;
        }
      }

      // Delete prior booking for this farmer
      await supabase.from("bookings").delete().eq("farmer_id", farmer.id);

      const { data: bData, error: bErr } = await supabase
        .from("bookings")
        .insert({
          farmer_id: farmer.id,
          center_id: center.id,
          booking_date: today,
          slot: selectedSlot,
          crop: params.crop,
          quantity: params.quantity,
          stage: "booked",
        })
        .select()
        .single();

      if (bErr || !bData) {
        return { success: false, message: bErr?.message || "Booking slot unavailable" };
      }

      const bRow = bData as BookingRow;
      const tokenFormatted = `${center.code}-${bRow.token_no ?? bRow.token?.replace("T-", "") ?? "100"}`;

      // Inbound SMS simulation
      notify(
        `Inbound SMS from +91-${cleanMobile.slice(-10)}: "BOOK ${center.code} ${params.crop.toUpperCase()} ${params.quantity}Q"`,
        "SMS",
      );

      // Automated Outbound confirmation SMS
      const replySms = `Krishi Setu: Aapka token ${tokenFormatted} pakka ho gaya hai. Mandi: ${center.name}, Samay: ${selectedSlot} aaj (${today}). Kripya samay par tractor le kar pahuchein.`;
      notify(replySms, "SMS");

      // Auto-set as tracked so they can see it
      localStorage.setItem(ME_KEY, farmer.id);
      setMyFarmerId(farmer.id);
      setTrackedBookingId(bRow.id);
      await load();

      return {
        success: true,
        token: tokenFormatted,
        slot: selectedSlot,
        message: replySms,
      };
    },
    [farmers, rows, load, notify],
  );

  const cancelMyBooking = useCallback(async () => {
    if (!me) return;
    await supabase.from("bookings").delete().eq("farmer_id", me.id);
    setTrackedBookingId(null);
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
      const center = CENTERS.find((c) => c.id === r.center_id);
      const displayToken = `${center?.code ?? "MND"}-${r.token_no ?? r.token?.replace("T-", "") ?? "100"}`;
      if (myFarmerId && r.farmer_id === myFarmerId) {
        const amount = Math.round(weight * MSP).toLocaleString("en-IN");
        const msg: Record<Stage, string> = {
          booked: "Slot booked.",
          checked_in: `Token ${displayToken} checked in at the gate.`,
          weighed: `Weighbridge recorded ${weight} quintals for token ${displayToken}.`,
          quality: `Quality check passed for token ${displayToken}.`,
          accepted: `Procurement accepted. Payable amount Rs ${amount}.`,
          paid: `Payment of Rs ${amount} credited to your bank account via DBT.`,
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
      const center = CENTERS.find((c) => c.id === centerId);
      const tokenDisplay = `${center?.code ?? "MND"}-${next.token_no ?? next.token?.replace("T-", "") ?? "100"}`;
      if (myFarmerId && next.farmer_id === myFarmerId) {
        notify(`Your token ${tokenDisplay} is being called. Please proceed to the gate.`, "App");
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
    farmers,
    bookings,
    myBooking,
    activeBooking,
    trackedBookingId,
    setTrackedBookingId,
    notifications,
    nowServing,
    bookSlot,
    cancelMyBooking,
    advance,
    setWeight,
    callNext,
    slotCount,
    notify,
    switchFarmer,
    startNewRegistration,
    lookupTokenOrAadhaar,
    bookViaSms,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
