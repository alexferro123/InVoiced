export const SK = {
  invoices:       "iv_inv_v3",
  folders:        "iv_folders_v3",
  trends:         "iv_trends_v3",
  clientInvoices: "iv_clinv_v3",
  clients:        "iv_clients_v3",
  bankRows:       "iv_bank_v3",
  company:        "iv_company_v3",
  theme:          "iv_theme_v3",
  onboarding:     "iv_onboard_v3",
} as const;

export const safeGet = async <T = unknown>(k: string): Promise<T | null> => {
  try {
    // @ts-expect-error window.storage is injected by the Claude artifact runtime
    const r = await window.storage.get(k);
    return r ? (JSON.parse(r.value) as T) : null;
  } catch {
    return null;
  }
};

export const safeSet = async (k: string, v: unknown): Promise<void> => {
  try {
    // @ts-expect-error window.storage is injected by the Claude artifact runtime
    await window.storage.set(k, JSON.stringify(v));
  } catch (e) {
    console.warn(e);
  }
};
