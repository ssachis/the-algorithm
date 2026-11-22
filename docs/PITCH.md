# Pitch script (2 minutes)

> Owner: Khyati. Rehearse with Sachi twice before judging.
> Demo Shorts: **[TBD: Short A link]** and **[TBD: Short B link]** (see the issue, #7). Keep the timestamps in brackets.

## 1. Hook (0:00–0:20)
Two friends post the same idea on the same week: a 5 AM morning routine, same trend, similar length.
One gets **48K views**. The other gets **800**.
Ask the room: *"Why?"*

> Note: the 48K / 800 pair is the mock demo's illustrative numbers. If we use it on stage, say so. The live demo should use real Shorts.

## 2. Paste a Short live (0:20–0:50)
- Paste the first demo Short into Wave.
- The waves canvas fills the screen. Your Short (marked **yours**) sits on the left; similar Shorts flow out to the right, in lanes by views. Further right = less similar.
- Say: *"Every card is a real Short on the same idea. Higher means more views."*

## 3. Flip "Remove creator size" (0:50–1:15)
- In the bottom dock, click **Remove creator size**. Cards move lanes by **views ÷ that creator's median views on their recent Shorts** (÷ subscribers only when the median isn't available). The breakouts pop up for a moment.
- Say: *"Views alone measure the creator as much as the idea. Comparing each Short to its creator's usual asks: did this one beat their normal reach?"*
- Click one breakout. The inspector opens with the Short playing; read its label (e.g. "Outlier >3×") and the "vs. their usual" number.

## 4. Why, with You.com sources (1:15–1:35)
- Click **Why** (top right). The sheet opens with **Meet your twin**: the same idea on TikTok, Reddit or Instagram, found by You.com.
- Scroll to **Why it's moving now · via You.com**. Read one sentence, then open one cited source.
- Say: *"You.com gives us the live context: where else this idea is moving this week and why, with sources you can click."*

## 5. What we can't know (1:35–1:45)
- In the same sheet, show the **Unknown** column, next to Observed and Hypotheses.
- Say: *"We can't see retention, impressions or how YouTube distributed these Shorts. We say so on the screen, not in a footnote."*

## 6. One experiment and close (1:45–2:00)
- Show **One next experiment**.
- Close: *"The algorithm doesn't always get you. But now you can get it."*

---

## Likely judge questions

**Q: Where does the data come from? Can you see retention or impressions?**
A: Public metrics only, from the YouTube Data API v3: views, likes, subscribers (when public), duration and publish date. "Remove creator size" compares each Short with the median views of that creator's recent Shorts, and the card shows how many Shorts that median is based on. We cannot see retention, impressions or traffic sources, and the product says so. Results are cached, so a repeat demo uses no extra quota.

**Q: Why only YouTube? Why not TikTok or Instagram?**
A: The build uses YouTube's public data for Shorts. Other platforms would need their own data access, which we haven't evaluated yet. Expanding is a next step, not something we've tested.

**Q: What's the business model?**
A: Not decided. This is a hackathon prototype. The likely users are creators and small teams who want to know whether a result came from the idea or from their own reach. We have not validated pricing or demand.
