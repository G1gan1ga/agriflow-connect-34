export type Lang = "en" | "hi" | "pa";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

type Dict = Record<string, [string, string, string]>;

// [English, Hindi, Punjabi]
const D: Dict = {
  ministry: [
    "Ministry of Consumer Affairs, Food & Public Distribution",
    "उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय",
    "ਖਪਤਕਾਰ ਮਾਮਲੇ, ਖੁਰਾਕ ਤੇ ਜਨਤਕ ਵੰਡ ਮੰਤਰਾਲਾ",
  ],
  department: [
    "Department of Consumer Affairs",
    "उपभोक्ता मामले विभाग",
    "ਖਪਤਕਾਰ ਮਾਮਲੇ ਵਿਭਾਗ",
  ],
  appName: ["Kisan Slot", "किसान स्लॉट", "ਕਿਸਾਨ ਸਲਾਟ"],
  tagline: [
    "Book a procurement slot. Skip the queue. Get paid faster.",
    "खरीद स्लॉट बुक करें। कतार से बचें। भुगतान जल्दी पाएं।",
    "ਖਰੀਦ ਸਲਾਟ ਬੁੱਕ ਕਰੋ। ਕਤਾਰ ਤੋਂ ਬਚੋ। ਭੁਗਤਾਨ ਜਲਦੀ ਲਵੋ।",
  ],
  farmerPortal: ["Farmer Portal", "किसान पोर्टल", "ਕਿਸਾਨ ਪੋਰਟਲ"],
  officerDashboard: ["Officer Dashboard", "अधिकारी डैशबोर्ड", "ਅਫ਼ਸਰ ਡੈਸ਼ਬੋਰਡ"],
  home: ["Home", "होम", "ਘਰ"],
  profile: ["Profile", "प्रोफ़ाइल", "ਪ੍ਰੋਫ਼ਾਈਲ"],
  bookSlot: ["Book Slot", "स्लॉट बुक करें", "ਸਲਾਟ ਬੁੱਕ ਕਰੋ"],
  liveQueue: ["Live Queue", "लाइव कतार", "ਲਾਈਵ ਕਤਾਰ"],
  payments: ["Payments", "भुगतान", "ਭੁਗਤਾਨ"],
  alerts: ["Alerts", "सूचनाएं", "ਸੂਚਨਾਵਾਂ"],
  farmerId: ["Farmer ID / Aadhaar", "किसान आईडी / आधार", "ਕਿਸਾਨ ਆਈਡੀ / ਆਧਾਰ"],
  name: ["Full name", "पूरा नाम", "ਪੂਰਾ ਨਾਮ"],
  village: ["Village", "गाँव", "ਪਿੰਡ"],
  mobile: ["Mobile number", "मोबाइल नंबर", "ਮੋਬਾਈਲ ਨੰਬਰ"],
  crop: ["Crop", "फसल", "ਫ਼ਸਲ"],
  landSize: ["Land size (acres)", "भूमि (एकड़)", "ਜ਼ਮੀਨ (ਏਕੜ)"],
  center: ["Procurement center", "खरीद केंद्र", "ਖਰੀਦ ਕੇਂਦਰ"],
  quantity: ["Quantity (quintals)", "मात्रा (क्विंटल)", "ਮਾਤਰਾ (ਕੁਇੰਟਲ)"],
  save: ["Save profile", "प्रोफ़ाइल सहेजें", "ਪ੍ਰੋਫ਼ਾਈਲ ਸੰਭਾਲੋ"],
  saved: ["Profile updated", "प्रोफ़ाइल अपडेट हुई", "ਪ੍ਰੋਫ਼ਾਈਲ ਅੱਪਡੇਟ ਹੋਈ"],
  pickDate: ["Pick a date", "तारीख चुनें", "ਤਾਰੀਖ਼ ਚੁਣੋ"],
  pickSlot: ["Pick a time slot", "समय स्लॉट चुनें", "ਸਮਾਂ ਸਲਾਟ ਚੁਣੋ"],
  confirmBooking: ["Confirm booking", "बुकिंग पक्की करें", "ਬੁਕਿੰਗ ਪੱਕੀ ਕਰੋ"],
  slotsLeft: ["left", "बचे", "ਬਾਕੀ"],
  full: ["Full", "भरा", "ਭਰਿਆ"],
  yourToken: ["Your token", "आपका टोकन", "ਤੁਹਾਡਾ ਟੋਕਨ"],
  nowServing: ["Now serving", "अभी चल रहा", "ਹੁਣ ਚੱਲ ਰਿਹਾ"],
  aheadOfYou: ["Farmers ahead of you", "आपसे आगे किसान", "ਤੁਹਾਡੇ ਤੋਂ ਅੱਗੇ ਕਿਸਾਨ"],
  estWait: ["Estimated wait", "अनुमानित प्रतीक्षा", "ਅਨੁਮਾਨਿਤ ਉਡੀਕ"],
  minutes: ["min", "मिनट", "ਮਿੰਟ"],
  pipeline: [
    "Procurement to payment",
    "खरीद से भुगतान तक",
    "ਖਰੀਦ ਤੋਂ ਭੁਗਤਾਨ ਤੱਕ",
  ],
  noBooking: [
    "No active booking yet. Book a slot to get a token.",
    "अभी कोई बुकिंग नहीं। टोकन के लिए स्लॉट बुक करें।",
    "ਹਾਲੇ ਕੋਈ ਬੁਕਿੰਗ ਨਹੀਂ। ਟੋਕਨ ਲਈ ਸਲਾਟ ਬੁੱਕ ਕਰੋ।",
  ],
  verifyToken: ["Verify & check in", "सत्यापित कर चेक-इन", "ਤਸਦੀਕ ਤੇ ਚੈੱਕ-ਇਨ"],
  weighbridge: ["Weighbridge", "तौल कांटा", "ਤੋਲ ਕੰਡਾ"],
  gateQueue: ["Gate & queue", "गेट व कतार", "ਗੇਟ ਤੇ ਕਤਾਰ"],
  analytics: ["Analytics", "विश्लेषण", "ਵਿਸ਼ਲੇਸ਼ਣ"],
  callNext: ["Call next token", "अगला टोकन बुलाएं", "ਅਗਲਾ ਟੋਕਨ ਸੱਦੋ"],
  advance: ["Advance stage", "अगला चरण", "ਅਗਲਾ ਪੜਾਅ"],
  language: ["Language", "भाषा", "ਭਾਸ਼ਾ"],
};

export function t(key: keyof typeof D | string, lang: Lang): string {
  const row = D[key];
  if (!row) return String(key);
  const i = lang === "en" ? 0 : lang === "hi" ? 1 : 2;
  return row[i]!;
}

export const STAGES = ["booked", "checked_in", "weighed", "quality", "accepted", "paid"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, [string, string, string]> = {
  booked: ["Slot booked", "स्लॉट बुक", "ਸਲਾਟ ਬੁੱਕ"],
  checked_in: ["Checked in at gate", "गेट पर चेक-इन", "ਗੇਟ 'ਤੇ ਚੈੱਕ-ਇਨ"],
  weighed: ["Weighbridge done", "तौल पूरा", "ਤੋਲ ਪੂਰਾ"],
  quality: ["Quality checked", "गुणवत्ता जांच", "ਗੁਣਵੱਤਾ ਜਾਂਚ"],
  accepted: ["Procurement accepted", "खरीद स्वीकृत", "ਖਰੀਦ ਮਨਜ਼ੂਰ"],
  paid: ["Payment credited", "भुगतान जमा", "ਭੁਗਤਾਨ ਜਮ੍ਹਾਂ"],
};

export function stageLabel(s: Stage, lang: Lang) {
  const i = lang === "en" ? 0 : lang === "hi" ? 1 : 2;
  return STAGE_LABEL[s][i]!;
}
