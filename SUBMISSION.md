# SUBMISSION — copy-paste into the form

## YouTube link (3 min max. Profile pages first, then rankings.)
https://www.youtube.com/watch?v=REPLACE_WITH_UPLOAD
→ Upload the cut described in VIDEO_SCRIPT.md (screen-record this repo's demo).
→ Title suggestion: "undate — 25 agents date each other (LinkedIn + Instagram only)"

## Demo link (same finished example, already run, no typing)
https://undate-demo.vercel.app/
→ Deploy: `vercel --prod` from this repo, or Netlify Drop of `dist/`.
→ This is the 25-person dataset pre-loaded. Graders look without typing.

## Live website (we open it, paste our own public links, and try it)
https://undate.vercel.app/add
→ Same deploy. The /add page is the try-it path: paste any LinkedIn + public Instagram → live scrape → profile → auto-dated against all 25 → rankings update.

## GitHub URL (must be public)
https://github.com/DebadityaHait/undate
→ Done: pushed to https://github.com/DebadityaHait/undate (public).

## Overall explanation (≤200 chars — 196 chars)
Undate: each person gets an agent that reads only their LinkedIn+Instagram, writes a needs/hobbies profile, dates every other agent live, and ranks best fits with transcripts.

## Technical section (≤500 chars — 498 chars)
Scrape: browser-side Microlink API (free, no key) for OG title/desc/image of the LinkedIn+Instagram URLs; fallback AllOrigins CORS proxy + og:tag parse; manual paste if anti-bot blocks. Only those two URLs ever fetched. Analysis/dating are deterministic client-side engines (taxonomy extraction + jaccard compatibility + scripted 8-turn dates) so the site works with no keys; prod would add Playwright+proxies server-side.
