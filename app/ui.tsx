"use client";

import { FormEvent, useEffect, useState } from "react";

type Usage = {
  checkedAt: string;
  subscriptions: Record<string, { used5h: number; limit5h: number; usedWeekly: number; limitWeekly: number; note?: string }>;
  api: Record<string, { balance: number | null; currency: string; spent?: number | null; note?: string; ok: boolean; error?: string; details?: Record<string, unknown> }>;
};

const subNames: Record<string, string> = {
  codex: "Codex",
  antigravity: "Antigravity",
  claude: "Claude Code",
};

const apiNames: Record<string, string> = {
  kimi: "Kimi / Moonshot",
  deepseek: "DeepSeek",
  glm: "GLM / Z.ai",
  qwen: "Qwen / DashScope",
};

function pct(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function money(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "未配置";
  return `${currency} ${Number(value).toFixed(2)}`;
}

export default function Dashboard({ authed }: { authed: boolean }) {
  const [ok, setOk] = useState(authed);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/usage", { cache: "no-store" });
    if (res.status === 401) setOk(false);
    if (!res.ok) setError("读取失败");
    else setUsage(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (ok) void load();
  }, [ok]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("密码不对");
      return;
    }
    setOk(true);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setOk(false);
    setUsage(null);
  }

  if (!ok) {
    return (
      <main className="login">
        <form onSubmit={login} className="loginBox">
          <h1>AI Usage</h1>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入访问密码"
          />
          <button>进入</button>
          {error && <p className="error">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>AI Usage</h1>
          <p>{usage ? `Last checked ${new Date(usage.checkedAt).toLocaleString()}` : "Ready"}</p>
        </div>
        <div className="actions">
          <button onClick={load} disabled={loading}>{loading ? "刷新中" : "刷新"}</button>
          <button className="ghost" onClick={logout}>退出</button>
        </div>
      </header>

      {error && <div className="banner">{error}</div>}

      <section className="grid subs">
        {Object.entries(usage?.subscriptions || {}).map(([key, item]) => (
          <article className="panel" key={key}>
            <div className="panelHead">
              <h2>{subNames[key]}</h2>
              <span>{item.note || "manual"}</span>
            </div>
            <Meter label="5 hours" used={item.used5h} limit={item.limit5h} />
            <Meter label="weekly" used={item.usedWeekly} limit={item.limitWeekly} />
          </article>
        ))}
      </section>

      <section className="panel apiPanel">
        <div className="panelHead">
          <h2>API 金额和余额</h2>
          <span>server-side keys</span>
        </div>
        <div className="apiList">
          {Object.entries(usage?.api || {}).map(([key, item]) => (
            <div className="apiRow" key={key}>
              <div>
                <strong>{apiNames[key]}</strong>
                <p>{item.error || item.note || (item.ok ? "已连接" : "未配置")}</p>
              </div>
              <div className="amounts">
                <span>{money(item.balance, item.currency)}</span>
                <small>spent {money(item.spent, item.currency)}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel envPanel">
        <div className="panelHead">
          <h2>Vercel 环境变量</h2>
          <span>不进浏览器</span>
        </div>
        <code>DASHBOARD_PASSWORD</code>
        <code>SESSION_SECRET</code>
        <code>MOONSHOT_API_KEY</code>
        <code>DEEPSEEK_API_KEY</code>
        <code>MANUAL_USAGE_JSON</code>
      </section>
    </main>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = pct(used, limit);
  return (
    <div className="meter">
      <div className="meterText">
        <span>{label}</span>
        <b>{limit ? `${used}/${limit}` : "未配置"}</b>
      </div>
      <div className="track">
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
