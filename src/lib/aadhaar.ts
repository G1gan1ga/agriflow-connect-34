/**
 * UIDAI Aadhaar Verification & e-KYC Simulation Utility
 * 
 * Implements:
 * 1. Verhoeff algorithm checksum validation (as mandated by UIDAI)
 * 2. 12-digit format and leading digit validation (Aadhaar never starts with 0 or 1)
 * 3. Simulated e-KYC OTP issuance and validation
 */

// Verhoeff multiplication table d
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff permutation table p
const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Verhoeff inverse table inv
const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a string of digits against the Verhoeff algorithm.
 */
export function validateVerhoeff(numStr: string): boolean {
  const digits = numStr.replace(/\D/g, "");
  if (digits.length !== 12) return false;

  let c = 0;
  const reversed = digits.split("").reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    const digit = reversed[i]!;
    c = d[c]![p[i % 8]![digit]!]!;
  }

  return c === 0;
}

/**
 * Generates the Verhoeff checksum digit for an 11-digit number.
 */
export function generateChecksumDigit(elevenDigits: string): number {
  const digits = elevenDigits.replace(/\D/g, "").slice(0, 11);
  let c = 0;
  const reversed = digits.split("").reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    const digit = reversed[i]!;
    c = d[c]![p[(i + 1) % 8]![digit]!]!;
  }

  return inv[c]!;
}

/**
 * Cleans and formats input into standard Aadhaar display format (XXXX-XXXX-XXXX).
 */
export function formatAadhaar(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join("-");
}

export type AadhaarValidationResult = {
  isValid: boolean;
  isChecksumValid: boolean;
  error?: string;
  cleanNumber: string;
  formatted: string;
};

/**
 * Full Aadhaar validation checking length, characters, first-digit rule and Verhoeff checksum.
 */
export function validateAadhaar(raw: string): AadhaarValidationResult {
  const clean = raw.replace(/\D/g, "");
  const formatted = formatAadhaar(raw);

  if (clean.length === 0) {
    return { isValid: false, isChecksumValid: false, error: "Aadhaar number is required", cleanNumber: "", formatted: "" };
  }

  if (clean.length < 12) {
    return {
      isValid: false,
      isChecksumValid: false,
      error: `Incomplete Aadhaar: ${clean.length}/12 digits entered`,
      cleanNumber: clean,
      formatted,
    };
  }

  if (clean.length > 12) {
    return {
      isValid: false,
      isChecksumValid: false,
      error: "Aadhaar number cannot exceed 12 digits",
      cleanNumber: clean.slice(0, 12),
      formatted,
    };
  }

  // UIDAI specification: Aadhaar numbers never start with 0 or 1
  if (clean.startsWith("0") || clean.startsWith("1")) {
    return {
      isValid: false,
      isChecksumValid: false,
      error: "Invalid Aadhaar: UIDAI numbers cannot start with 0 or 1",
      cleanNumber: clean,
      formatted,
    };
  }

  const isChecksumValid = validateVerhoeff(clean);
  if (!isChecksumValid) {
    return {
      isValid: false,
      isChecksumValid: false,
      error: "Checksum failed: Not a genuine Aadhaar number (Verhoeff check failed)",
      cleanNumber: clean,
      formatted,
    };
  }

  return {
    isValid: true,
    isChecksumValid: true,
    cleanNumber: clean,
    formatted,
  };
}

/**
 * Creates a valid 12-digit sample Aadhaar with mathematically correct Verhoeff checksum
 * for rapid testing during hackathon presentations.
 */
export function generateDemoAadhaar(seed: number = 28417712120): string {
  const eleven = String(seed).slice(0, 11).padEnd(11, "5");
  const check = generateChecksumDigit(eleven);
  return formatAadhaar(eleven + check);
}

// In-memory store for simulated OTP requests
const activeOtps = new Map<string, { otp: string; expires: number }>();

/**
 * Simulates sending an Aadhaar e-KYC OTP via UIDAI SMS gateway.
 */
export function sendAadhaarOtp(aadhaar: string): { success: boolean; otp?: string; message: string } {
  const val = validateAadhaar(aadhaar);
  if (!val.isValid) {
    return { success: false, message: val.error ?? "Invalid Aadhaar number" };
  }

  // Generate 6 digit OTP (for demo, e.g. deterministic or random)
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  activeOtps.set(val.cleanNumber, { otp, expires: Date.now() + 5 * 60 * 1000 });

  return {
    success: true,
    otp,
    message: `OTP sent to mobile linked with Aadhaar ending in ${val.cleanNumber.slice(-4)}.`,
  };
}

/**
 * Simulates verifying the 6-digit Aadhaar OTP against UIDAI e-KYC servers.
 */
export function verifyAadhaarOtp(aadhaar: string, enteredOtp: string): { success: boolean; message: string } {
  const val = validateAadhaar(aadhaar);
  if (!val.isValid) {
    return { success: false, message: "Invalid Aadhaar number" };
  }

  // Allow default universal demo code "123456" or the actual generated OTP
  const record = activeOtps.get(val.cleanNumber);
  if (enteredOtp === "123456" || (record && record.otp === enteredOtp.trim())) {
    return {
      success: true,
      message: "e-KYC Verified Successfully via UIDAI National Identity Registry.",
    };
  }

  return {
    success: false,
    message: "Incorrect OTP. Please enter the 6-digit OTP received via SMS (or demo OTP 123456).",
  };
}
