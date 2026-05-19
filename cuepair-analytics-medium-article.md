# How I Added Free, Privacy-Friendly Analytics to My GitHub Pages Site Before Launch

*Cloudflare Web Analytics, five minutes, no cookies, no banner, no backend.*

---

We're launching [CuePair](https://rohitsainier.github.io/pages/cuepair/) in a few weeks — a tool that lets you record content once and publish it everywhere, with speech recognition and encoding running entirely in your browser. The landing page lives on GitHub Pages because it's free, fast, and a marketing page doesn't need a backend.

But "static + free" comes with a problem I'd been ignoring: **I had no idea who was visiting.**

Before launch I really wanted answers to four questions:

- Is anyone actually showing up?
- Which countries are they from?
- Which links are sending them (Twitter? a friend? a newsletter?)
- Is traffic flat, growing, or spiking on the days I post?

I didn't need session recordings or funnels. I just needed a counter and a map. So I went looking for the lightest free option that would not make my landing page feel gross.

## Why I didn't pick Google Analytics

GA4 was the obvious default. It's free, it tells you everything, and every tutorial on the internet recommends it. But three things bothered me:

1. **It sets cookies**, which means I'd need a cookie consent banner for EU visitors. That's the first thing a stranger sees when they land on my page. Hard pass.
2. **The script is heavy** — around 50KB of JavaScript and a few network requests on every load. The rest of my landing page is tiny; adding GA would make it the heaviest dependency on the page.
3. **It clashed with the product's pitch.** CuePair's whole identity is "your data stays on your device." Stuffing a Google tracker onto the marketing site felt like a brand contradiction before we'd even shipped.

So I kept looking.

## Why I picked Cloudflare Web Analytics

I landed on **Cloudflare Web Analytics**. The pitch:

- Free, with no usage cap I'll ever hit
- A single ~5KB script
- No cookies, no fingerprinting, no personal data — Cloudflare explicitly states it does not track individual visitors
- No cookie banner required, because there's nothing to consent to
- **Does not require your domain to be on Cloudflare's proxy** — you can use the standalone version on a plain `*.github.io` URL

It gives you pageviews, top pages, top referrers, top countries, device/browser breakdown, and a near-real-time view. Exactly the bucket I needed.

## The setup, end to end

About five minutes of work.

**1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).** A free account is enough — no credit card needed.

**2. Open Web Analytics.** In the sidebar: *Analytics & Logs → Web Analytics*. Click **Add a site**.

**3. Choose the standalone option.** Cloudflare will offer two paths — pick the one labeled something like *"with a free Cloudflare Web Analytics-only setup."* This is the version that does **not** require your domain to be on Cloudflare's proxy.

**4. Enter your hostname.** Just the bare hostname — no protocol, no path, no trailing slash:

```
yourusername.github.io
```

If you have a custom domain (`yoursite.com`), enter that. If you're using the default GitHub Pages subdomain, note that one hostname will track *all* of your GitHub Pages projects sharing it. That can actually be a feature — you can filter by URL path in the dashboard later.

**5. Copy the snippet.** You'll get back a `<script>` tag with your unique token:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "your-token-here"}'></script>
<!-- End Cloudflare Web Analytics -->
```

**6. Paste it before `</head>` in your `index.html`.** That's the entire integration. No build step, no config file, no environment variable.

**7. Commit and push.** GitHub Pages redeploys in 30 seconds to two minutes.

The first pageview lands in your dashboard within about a minute.

## The gotcha that will trip you up

When I first tested it in Brave, the beacon never fired. I tried the DuckDuckGo browser — same thing. The Network tab in DevTools was completely empty of any Cloudflare requests. I assumed I'd broken the integration.

I hadn't. Brave's Shields and DuckDuckGo's tracker blocking both classify `static.cloudflareinsights.com` as a tracker and block the request before it ever leaves the browser. Same story with uBlock Origin, Privacy Badger, and Firefox's *Strict* tracking protection.

**To verify your setup is actually working**, test in one of these instead:

- Chrome (default settings)
- Safari (default settings)
- Firefox (default tracking protection — not Strict)
- Your phone's mobile browser

Pageviews will show up in your Cloudflare dashboard within a minute.

**For real visitors**, expect roughly a 10–20% undercount — that's the slice of your audience running tracker blockers. This is true of *every* third-party analytics tool. GA4, Plausible Cloud, Umami Cloud, Fathom — they all get blocked. The only way around it is self-hosting on a first-party subdomain with a backend, which is wildly overkill for a launch page.

The numbers are directionally accurate. That's what matters for "is this going up or sideways."

## A free backup: GitHub's own traffic stats

Bonus that almost no one uses: GitHub Pages quietly exposes its own analytics for your repo.

Go to **Your repo → Insights → Traffic.**

You get unique visitors and total views for the last 14 days. It's less detailed (no countries, no real-time, updates once per day), but it's measured from raw HTTP logs server-side, so **nothing on the client can block it.** I use it as a sanity check against Cloudflare's numbers — if Cloudflare says 100 views and GitHub says 130, the gap is roughly my "blocked by ad-blockers" rate.

## What I'm actually watching before launch

With this in place, my pre-launch checklist for the landing page is small but pointed:

- **Pageview trend** — flat, growing, or spiky? Spikes tell me a post or tweet landed.
- **Top countries** — tells me where to time launch announcements and which timezones matter.
- **Top referrers** — tells me which channels are actually working so I can double down.
- **Mobile vs. desktop split** — tells me whether my responsive layout is doing its job before I find out the hard way.

That's the whole dashboard. No funnels, no goals, no events. Just a heartbeat.

## The takeaway

Five minutes of setup, zero cost, no cookies, no banners, no backend. If you're launching something soon and your landing page is on GitHub Pages — go do this before you post your first promo.

You can't optimize what you can't see, and "I think traffic is up" is not a strategy.

---

*If you're curious what we're building, [CuePair](https://rohitsainier.github.io/pages/cuepair/) is a recording tool where everything runs locally — speech recognition, video encoding, all of it. Launching soon.*
