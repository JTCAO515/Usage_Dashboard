# AI Usage Dashboard

Personal Vercel dashboard for AI usage and API balances.

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Vercel env vars

Required:

- `DASHBOARD_PASSWORD`: password shown before the dashboard opens
- `SESSION_SECRET`: long random string for the login cookie

Optional automatic balance checks:

- `MOONSHOT_API_KEY`: Kimi/Moonshot balance
- `DEEPSEEK_API_KEY`: DeepSeek balance
- `ALIYUN_ACCESS_KEY_ID`: Aliyun RAM AccessKey for Qwen/DashScope account balance
- `ALIYUN_ACCESS_KEY_SECRET`: Aliyun RAM AccessKey secret for Qwen/DashScope account balance
- `GLM_API_KEY`: Zhipu BigModel API key for Coding Plan quota
- `GLM_API_HOST` (optional): defaults to `open.bigmodel.cn`; use `api.z.ai` for the global region
- `GLM_ORG_ID` / `GLM_PROJECT_ID` (optional): required only for BigModel team-scoped quota

For the Aliyun key, grant the RAM user permission for `QueryAccountBalance` (`bss:DescribeAcccount`). The value shown is the Aliyun account balance from BSS OpenAPI, not DashScope-only token spend.

GLM has no public wallet-balance API. `GLM_API_KEY` reads the Coding Plan token/time quota (`/api/monitor/usage/quota/limit`) instead — `balance`/`spent` stay empty and the quota shows up in `note`/`details`.

Manual values for providers without a wired public endpoint:

- `MANUAL_USAGE_JSON`

Example:

```json
{
  "subscriptions": {
    "codex": { "used5h": 12, "limit5h": 50, "usedWeekly": 80, "limitWeekly": 500, "note": "manual" },
    "antigravity": { "used5h": 3, "limit5h": 50, "usedWeekly": 20, "limitWeekly": 500, "note": "manual" },
    "claude": { "used5h": 28, "limit5h": 45, "usedWeekly": 190, "limitWeekly": 300, "note": "manual" }
  },
  "api": {
    "glm": { "balance": 88.2, "currency": "CNY", "spent": 13.4, "note": "manual" },
    "qwen": { "balance": 120, "currency": "CNY", "spent": 42.5, "note": "manual" }
  }
}
```

## Notes

Codex, Antigravity, and Claude Code 5-hour/weekly usage are manual because a Vercel deployment cannot read local app logs from your devices. Kimi, DeepSeek, and Qwen/DashScope balance use server-side API calls when keys are configured; browser code never receives the API keys.
