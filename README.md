# undate — agents date, humans watch 💘

An **agentic dating harness**. Each person is represented by an agent. The agent dates on that person's behalf. The agents date each other.

## The rule (strict)
For every person, and every agent, there are **exactly two sources**:
1. the person's **LinkedIn** (public profile)
2. the person's **Instagram** (public profile)

Nothing else. The scraper only ever fetches those two URLs. The profile page shows which trait came from which source.

## Flow
```
LinkedIn (public) + Instagram (public)
  ↓  scraper: Microlink OG (no key) → AllOrigins CORS proxy + OG parse → manual paste fallback
Agent reads both, analyzes the person
  ↓  analyzer: taxonomy extraction (needs/hobbies/interests/values/lifestyle)
Profile page: needs · hobbies · interests · values · ideal match · dealbreakers
  ↓  dating sim: every pair meets, 8-turn date with thinking, chemistry/values/lifestyle scored
Ranking: for every person, who fits them best (sorted + transcripts)
```

## Demo: 25 real people, 300 dates
Pre-loaded in `src/data/people.ts` — 13M / 12F, all with official LinkedIn + public Instagram:

Gary Vaynerchuk, Sara Blakely, Simon Sinek, Brené Brown, Tim Ferriss, Mel Robbins, Jay Shetty, Whitney Wolfe Herd, Alexis Ohanian, Serena Williams, Marques Brownlee, Sophia Amoruso, Casey Neistat, Adam Grant, Alex Hormozi, Leila Hormozi, Richard Branson, Bill Gates, Melinda French Gates, Steven Bartlett, Emma Grede, Codie Sanchez, Chris Williamson, Arianna Huffington, Bozoma Saint John.

Open `/` → `/profiles` → `/arena` → `/rankings`. Or paste your own links at `/add`.

## Run
```bash
npm install
npm run dev     # local
npm run build   # static dist/ → deploy to Vercel/Netlify as-is
```

No API keys needed. Everything runs client-side so the live site works when graders open it.

## Scrape stack (for the technical section)
- **Primary: Microlink API (free, no key)** — `https://api.microlink.io?url=<linkedin|instagram>` returns OpenGraph title/description/image/author + insights. Works from the browser, no auth, CORS-open.
- **Fallback: AllOrigins CORS proxy + manual OpenGraph parse** — fetch raw HTML via `https://api.allorigins.win/raw?url=…`, parse `og:title / og:description / og:image` with regex. Handles cases where Microlink is rate-limited.
- **Last resort: manual paste** — LinkedIn/Instagram aggressively block bots (login walls, 429s). If both fetches fail, the UI shows the blocked proof and lets the user paste the *public* headline/bio text (still only from those two URLs). Demo data ships with cached public bios so the 25-person example runs instantly without hitting rate limits.

Why this stack: no secrets to leak, no server to run, graders can paste any public links and get a result. A production version would add a small server with Playwright + rotating residential proxies + authenticated `instaloader`/`linkedin-scraper` jobs, but that would break the "open the live site and try it" requirement.

## Repo layout
- `src/data/people.ts` — 25 real people
- `src/lib/scraper.ts` — two-source fetcher
- `src/lib/analyzer.ts` — agent reader → AgentProfile
- `src/lib/dating.ts` — compatibility + 8-turn date sim + ranking
- `src/lib/store.tsx` — pool + localStorage + recompute
- `src/pages/` — Landing, Profiles, ProfileDetail, Arena, Rankings, AddPerson

## Video
See `VIDEO_SCRIPT.md` — 3:00 shot-list: profile pages first, then agents dating, then paste-links → rankings.
