const TAP_API = "https://api.tap.company/v2";

function secret(): string {
  return process.env.TAP_SECRET_KEY ?? "";
}

export type TapCharge = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  transaction?: { url?: string };
  customer?: { id?: string };
  metadata?: Record<string, string>;
};

type CreateChargeInput = {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  metadata: Record<string, string>;
  redirectUrl: string;
  postUrl: string;
  description?: string;
};

export async function createCharge(input: CreateChargeInput): Promise<TapCharge> {
  const res = await fetch(`${TAP_API}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      description: input.description ?? "Lawyer ID Pro",
      threeDSecure: true,
      save_card: false,
      customer: {
        first_name: input.customerName || "Lawyer",
        email: input.customerEmail,
      },
      source: { id: "src_all" },
      metadata: input.metadata,
      redirect: { url: input.redirectUrl },
      post: { url: input.postUrl },
    }),
  });
  const data = (await res.json()) as TapCharge;
  if (!res.ok) {
    throw new Error(`Tap createCharge failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function retrieveCharge(id: string): Promise<TapCharge> {
  const res = await fetch(`${TAP_API}/charges/${id}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const data = (await res.json()) as TapCharge;
  if (!res.ok) {
    throw new Error(`Tap retrieveCharge failed: ${res.status}`);
  }
  return data;
}
