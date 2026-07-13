/** Mobile port of web's `lib/supportEmail.ts` — same Web3Forms endpoint and
 * payload shape, but keyed by the Expo public env var. */

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export const SUPPORT_EMAIL = 'team@freshr.cc';
export const BUSINESS_PHONE = '+8801813884557 +8801873070777';
export const BUSINESS_HOURS = 'Sun–Thu, 10:00–18:00 (GMT+6)';
export const BUSINESS_ADDRESS_LINES = ["Ground floor, Setara's Dream, 1/11 Pallabi Mirpur"];

export interface SupportFormPayload {
  fullName: string;
  email: string;
  mobile: string;
  message: string;
}

export async function sendSupportEmail(payload: SupportFormPayload): Promise<void> {
  const accessKey = process.env.EXPO_PUBLIC_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_WEB3FORMS_ACCESS_KEY — set it in .env.local (same key as web).'
    );
  }

  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `[SUPPORT] Support request from ${payload.fullName}`,
      from_name: payload.fullName,
      replyto: payload.email,
      name: payload.fullName,
      email: payload.email,
      mobile: payload.mobile,
      message: payload.message,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || `Failed to send (HTTP ${res.status})`);
  }
}
