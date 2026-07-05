export type SubscriptionUsage = {
  used5h: number;
  limit5h: number;
  usedWeekly: number;
  limitWeekly: number;
  note?: string;
};

export type ApiUsage = {
  balance: number | null;
  currency: string;
  spent?: number | null;
  note?: string;
  ok: boolean;
  error?: string;
  details?: Record<string, unknown>;
};

const emptySub: SubscriptionUsage = {
  used5h: 0,
  limit5h: 0,
  usedWeekly: 0,
  limitWeekly: 0,
  note: "No public cloud API configured; set MANUAL_USAGE_JSON.",
};

type ManualConfig = {
  subscriptions?: Record<string, Partial<SubscriptionUsage>>;
  api?: Record<string, Partial<ApiUsage>>;
};

function manualConfig(): ManualConfig {
  if (!process.env.MANUAL_USAGE_JSON) return {};
  try {
    return JSON.parse(process.env.MANUAL_USAGE_JSON);
  } catch {
    return {};
  }
}

function manualSub(key: string): SubscriptionUsage {
  return { ...emptySub, ...manualConfig().subscriptions?.[key] };
}

function manualApi(key: string): ApiUsage {
  const value = manualConfig().api?.[key];
  return {
    balance: value?.balance ?? null,
    currency: value?.currency ?? "CNY",
    spent: value?.spent ?? null,
    note: value?.note ?? "Manual value; no public balance endpoint wired.",
    ok: value?.balance !== undefined || value?.spent !== undefined,
  };
}

async function fetchJson(url: string, apiKey: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || json?.error?.message || `${res.status} ${res.statusText}`);
  return json;
}

async function kimi(): Promise<ApiUsage> {
  if (!process.env.MOONSHOT_API_KEY) return manualApi("kimi");
  const json = await fetchJson("https://api.moonshot.cn/v1/users/me/balance", process.env.MOONSHOT_API_KEY);
  return {
    balance: json?.data?.available_balance ?? null,
    currency: "CNY",
    spent: null,
    ok: Boolean(json?.status),
    details: {
      cash: json?.data?.cash_balance,
      voucher: json?.data?.voucher_balance,
    },
  };
}

async function deepseek(): Promise<ApiUsage> {
  if (!process.env.DEEPSEEK_API_KEY) return manualApi("deepseek");
  const json = await fetchJson("https://api.deepseek.com/user/balance", process.env.DEEPSEEK_API_KEY);
  const cny = json?.balance_infos?.find((item: { currency?: string }) => item.currency === "CNY");
  const first = cny || json?.balance_infos?.[0];
  return {
    balance: first ? Number(first.total_balance) : null,
    currency: first?.currency || "CNY",
    spent: null,
    ok: Boolean(json?.is_available),
    details: first
      ? {
          granted: first.granted_balance,
          toppedUp: first.topped_up_balance,
        }
      : undefined,
  };
}

async function safe(name: string, fn: () => Promise<ApiUsage>) {
  try {
    return await fn();
  } catch (error) {
    return {
      balance: null,
      currency: "CNY",
      ok: false,
      error: error instanceof Error ? error.message : `${name} request failed`,
    };
  }
}

export async function getUsage() {
  const [kimiApi, deepseekApi] = await Promise.all([safe("kimi", kimi), safe("deepseek", deepseek)]);

  return {
    checkedAt: new Date().toISOString(),
    subscriptions: {
      codex: manualSub("codex"),
      antigravity: manualSub("antigravity"),
      claude: manualSub("claude"),
    },
    api: {
      kimi: kimiApi,
      deepseek: deepseekApi,
      glm: manualApi("glm"),
      qwen: manualApi("qwen"),
    },
  };
}
