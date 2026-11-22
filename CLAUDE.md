# Wave — instructions for coding agents

**Product:** Paste a YouTube Short → find similar Shorts on the same idea → show them as a ripple map
→ explain why some took off (content, timing, creator size) → give one next experiment.
Tagline: *Same idea. Different outcomes.*

Built in ~3 hours at Creator Economy Hack NYC. **Every project must use the You.com API.** Repo must stay public.

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript. Plain CSS in `app/globals.css` (no Tailwind, no UI kits).
- Ripple map is hand-written SVG in `components/RippleMap.tsx` (no D3 needed).
- No database, no auth. Cache API responses as JSON files under `.cache/` (gitignored).

## Run
```bash
npm install
cp .env.example .env.local   # USE_MOCK=1 serves demo data with no keys
npm run dev                  # http://localhost:3000
```

## Layout
```
app/page.tsx              single-page flow: idle → loading → results (Sachi owns)
app/api/analyze/route.ts  POST {url} → AnalyzeResponse (Melody owns)
components/               RippleMap, ModeToggle, VideoPanel, Verdict, Timeline, Rings, DropInput
lib/types.ts              THE data contract. Do not change without telling the team.
lib/score.ts              similarity, outperformance (views / max(subs,100)), formatting
lib/mock-data.ts          fictional demo data in the exact AnalyzeResponse shape
```

## Rules
1. **Stay inside your issue's files.** If you must touch a file owned by someone else, say so in the PR.
2. **`lib/types.ts` is the contract.** UI reads only `AnalyzeResponse`. Backend returns only `AnalyzeResponse`.
3. **Never commit keys.** Use `.env.local`. Read keys only on the server (route handlers / `lib/*` used by routes).
4. **Design language:** quiet, editorial, still water. Near-white `#FBFCFD`, mist `#EEF3F8`, water blue `#3B7DD8`,
   deep blue `#0B3D91` (see `:root` in globals.css). Accent only for selection or meaningful performance.
   Evidence discipline in UI: Observed / Hypotheses / Unknown are always separate. Performance labels
   (Below usual <0.5×, Around usual, Strong 1.5–3×, Outlier >3×) are project-defined; show the definition. Serif (`.serif`) for voice,
   Inter for data. Generous spacing, rounded cards, slow eased motion. No emojis in UI, no charts libraries,
   no dark mode. Reuse CSS variables; add new classes to `globals.css`.
5. **Honesty is a feature:** never claim to know YouTube's internal algorithm, never invent retention,
   impressions or audience data. Missing numbers (hidden subs/likes) show as "hidden" — never crash.
6. **Demo safety:** `USE_MOCK=1` must always work offline. Live calls must be cached so a repeat demo
   costs zero quota (YouTube `search.list` = 100 units of a 10,000/day quota).
7. Small PRs, one issue each, title `#<issue> short description`. Run `npm run build` before opening.

## YouTube Data API v3 calls (backend)
- `videos.list?part=snippet,statistics,contentDetails&id=...` (batch up to 50 ids)
- `search.list?part=snippet&type=video&videoDuration=short&q=<query> #shorts&maxResults=25`
- `channels.list?part=statistics&id=...` (batch) → `subscriberCount` (may be hidden)
- Keep only videos with `durationSec <= 180` (Shorts).

## You.com
- Search the trend/idea for **why it's moving now** → `verdict.trend.summary` + `sources`.
- Generate the verdict (patterns, timing, unknowns, next experiment) grounded in our computed numbers.
