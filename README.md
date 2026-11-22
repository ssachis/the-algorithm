# the algorithm.

**Same idea. Different outcomes.**

Paste a YouTube Short and The Algorithm finds other Shorts on the same trend or idea. They ripple out from
yours on a map, sized by views. One toggle removes creator size, so you see which videos actually beat
their creator's usual reach. You.com explains, with sources, why the trend is moving right now, and you
leave with one concrete experiment for your next post.

> The algorithm doesn't always get you. But now you can get it.

Built at **Creator Economy Hack NYC** (You.com × localhost:nyc × GenZtea).

## How it works
1. **Drop** a YouTube Short link.
2. **Find** similar Shorts with the YouTube Data API and You.com search.
3. **Normalize**: outperformance = views ÷ subscribers (floored at 100).
4. **Explain**: You.com gives live, cited context on the trend; the verdict separates what we observed,
   what might explain it, and what public data can't tell us.

## Run locally
```bash
npm install
cp .env.example .env.local   # USE_MOCK=1 runs on demo data, no keys needed
npm run dev
```

## Team
- Sachi Singh — product, UI, end-to-end flow
- Melody — backend and data pipeline
- Khyati — pitch, demo and frontend components

_Pitch, screenshots and demo video coming soon._
