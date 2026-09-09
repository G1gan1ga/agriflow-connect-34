import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  slot: string; // "09:00 - 10:00"
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
  farmerId: string;
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

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function clock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SEED_NAMES = [
  ["Ramesh Yadav", "Nissing"],
  ["Sukhwinder Kaur", "Jagraon"],
  ["Mahesh Patel", "Berasia"],
  ["Anil Kumar", "Gharaunda"],
  ["Balwinder Singh", "Raikot"],
  ["Geeta Devi", "Assandh"],
  ["Harpreet Singh", "Sudhar"],
  ["Sunita Bai", "Kolar"],
];

function seedBookings(): Booking[] {
  const out: Booking[] = [];
  const stages: Stage[] = ["paid", "accepted", "weighed", "checked_in", "booked", "booked", "booked", "booked"];
  SEED_NAMES.forEach((n, i) => {
    const center = CENTERS[i % CENTERS.length]!;
    const stage = stages[i]!;
    const qty = 20 + i * 5;
    out.push({
      id: `b${i + 1}`,
      token: `T-${101 + i}`,
      farmerName: n[0]!,
      farmerId: `XXXX-XXXX-${1200 + i}`,
      village: n[1]!,
      crop: CROPS[i % CROPS.length]!,
      quantity: qty,
      centerId: center.id,
      date: todayISO(),
      slot: SLOTS[i % SLOTS.length]!,
      stage,
      weightQuintals: STAGES.indexOf(stage) >= 2 ? qty - 0.4 : undefined,
      amount: STAGES.indexOf(stage) >= 4 ? Math.round((qty - 0.4) * 2275) : undefined,
    });
  });
  return out;
}

const SEED_PROFILE: Profile = {
  farmerId: "XXXX-XXXX-4417",
  name: "Ishan Singh",
  village: "Taraori",
  mobile: "98xxxxxx21",
  crop: "Wheat",
  landSize: 4.5,
  centerId: "c1",
  quantity: 32,
};

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  profile: Profile;
  saveProfile: (p: Profile) => void;
  bookings: Booking[];
  myBooking?: Booking | undefined;
  notifications: Notification[];
  nowServing: Record<string, string>;
  bookSlot: (date: string, slot: string) => void;
  cancelMyBooking: () => void;
  advance: (id: string) => void;
  setWeight: (id: string, weight: number) => void;
  callNext: (centerId: string) => void;
  slotCount: (centerId: string, date: string, slot: string) => number;
  notify: (text: string, channel?: "SMS" | "App") => void;
};

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [profile, setProfile] = useState<Profile>(SEED_PROFILE);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [nowServing, setNowServing] = useState<Record<string, string>>({
    c1: "T-104",
    c2: "T-102",
    c3: "T-103",
  });
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", channel: "SMS", text: "Procurement center Karnal is open 08:00-15:00 today.", time: "07:10" },
    { id: "n2", channel: "App", text: "MSP for Wheat is Rs 2275 per quintal this season.", time: "07:12" },
  ]);

  const notify = useCallback((text: string, channel: "SMS" | "App" = "SMS") => {
    setNotifications((n) => [
      { id: `n${Date.now()}${Math.round(Math.random() * 999)}`, channel, text, time: clock() },
      ...n,
    ]);
  }, []);

  const myBooking = useMemo(() => bookings.find((b) => b.isMe), [bookings]);

  const slotCount = useCallback(
    (centerId: string, date: string, slot: string) =>
      bookings.filter((b) => b.centerId === centerId && b.date === date && b.slot === slot).length,
    [bookings],
  );

  const bookSlot = useCallback(
    (date: string, slot: string) => {
      setBookings((prev) => {
        const rest = prev.filter((b) => !b.isMe);
        const token = `T-${200 + rest.length}`;
        const booking: Booking = {
          id: `me-${Date.now()}`,
          token,
          farmerName: profile.name,
          farmerId: profile.farmerId,
          village: profile.village,
          crop: profile.crop,
          quantity: profile.quantity,
          centerId: profile.centerId,
          date,
          slot,
          stage: "booked",
          isMe: true,
        };
        notify(
          `Token ${token} confirmed for ${slot} on ${date} at ${
            CENTERS.find((c) => c.id === profile.centerId)?.name
          }. Carry your Farmer ID.`,
        );
        return [...rest, booking];
      });
    },
    [profile, notify],
  );

  const cancelMyBooking = useCallback(() => {
    setBookings((prev) => prev.filter((b) => !b.isMe));
    notify("Your slot booking has been cancelled.", "App");
  }, [notify]);

  const advance = useCallback(
    (id: string) => {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const i = STAGES.indexOf(b.stage);
          if (i >= STAGES.length - 1) return b;
          const stage = STAGES[i + 1]!;
          const weight = b.weightQuintals ?? Math.max(1, b.quantity - 0.4);
          const next: Booking = {
            ...b,
            stage,
            weightQuintals: stage === "weighed" ? weight : b.weightQuintals,
            amount: stage === "accepted" ? Math.round(weight * 2275) : b.amount,
          };
          if (b.isMe) {
            const msg: Record<Stage, string> = {
              booked: "Slot booked.",
              checked_in: `Token ${b.token} checked in at the gate.`,
              weighed: `Weighbridge recorded ${next.weightQuintals} quintals for token ${b.token}.`,
              quality: `Quality check passed for token ${b.token}.`,
              accepted: `Procurement accepted. Payable amount Rs ${next.amount?.toLocaleString("en-IN")}.`,
              paid: `Payment of Rs ${next.amount?.toLocaleString("en-IN")} credited to your bank account.`,
            };
            notify(msg[stage]);
          }
          return next;
        }),
      );
    },
    [notify],
  );

  const setWeight = useCallback((id: string, weight: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              weightQuintals: weight,
              stage: STAGES.indexOf(b.stage) < 2 ? "weighed" : b.stage,
            }
          : b,
      ),
    );
  }, []);

  const callNext = useCallback(
    (centerId: string) => {
      const waiting = bookings
        .filter((b) => b.centerId === centerId && b.stage === "booked")
        .sort((a, b) => a.slot.localeCompare(b.slot));
      const next = waiting[0];
      if (!next) return;
      setNowServing((s) => ({ ...s, [centerId]: next.token }));
      advance(next.id);
      if (next.isMe) notify(`Your token ${next.token} is being called. Please proceed to the gate.`, "App");
    },
    [bookings, advance, notify],
  );

  const value: Store = {
    lang,
    setLang,
    profile,
    saveProfile: setProfile,
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
