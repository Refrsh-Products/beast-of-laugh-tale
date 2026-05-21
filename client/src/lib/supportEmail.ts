const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export interface SupportFormPayload {
  fullName: string;
  email: string;
  mobile: string;
  message: string;
}

export async function sendSupportEmail(payload: SupportFormPayload): Promise<void> {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    throw new Error(
      "Missing VITE_WEB3FORMS_ACCESS_KEY — get a key at https://web3forms.com and add it to client/.env",
    );
  }

  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
