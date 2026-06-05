# time-flies
Submission to Long Now Foundation's "Book of Time," 02026


# Spec

This application demonstrates a method of thinking about the subjective experience of time, and how that can change for an individual based on the activity the individual is doing. 

In 01938, Herbert E. Ives and G. R. Stilwell demonstrated the existence of relativistic time dilation, providing physical proof of the relativity of time. Relative time can be used as a metaphor for the subjective experience of time: individuals have a sense for time, but it's inaccurate compared to even simple clocks, and changes moment to moment. An example is demonstrated by the adage "time flies when you're having fun." One hour waiting in a doctor's office "feels longer" than one hour of playing basketball. Thirty minutes feels different between a human that is hungry and waiting for their meal than it does to the human preparing it while being shouted at by an angry chef. Ten minutes feels different to a parent driving a car and the child riding in it.

"Time Flies" represents this subjective elasticity of time as a visual metaphor in the form of a contemporary depiction of a black hole as popularized in the 02014 film "Interstellar". Users indicate whether an activity "dragged" or "flew," which causes an activity to be placed further away from (time dragged) or closer to (time flew) the black hole. This maps to the reality of relativistic time: faster acceleration, or close proximity to a black hole, cause an individual to experience "less time" than a slower reference. 

"The Zone" is a state of experience where time "falls away" and an individual becomes one with an activity. This is a singularity, a place outside of time and individual experience, where the ego has dissolved, a subjective factor of infinity. This is invisible to the outside world, just as the outside world is invisible to the individual when they're "in the zone," and so this is represented by the event horizon.  This captures the paradox of subjective time elasticity, wherein though time "flies" when in the zone, it somehow feels like a more dense experience, as if the time had higher surface area. 

In order to service the metaphor, the "reference time" is set within the orbit of the black hole, between the corona (outer orbit) and accretion disk (inner orbit).

As a user lists activities and their expansion ratios, the hope is that individuals will have a better understanding of the kind of activities that can get them close to, or into, "the zone." It's a tool to help users recognize what activities bring them frustration and boredom, and what activities bring them absorption and fulfillment.


## Technical Specifications

This is a single-page app designed to render on web browsers with javascript enabled. Non-javascript browsers are shown a notice asking them to enable javascript.

The app is built with a toolchain, but the **output** is a set of plain static files (`dist/`) — hashed HTML, JS, and CSS — that can be served from any static host (GitHub Pages, Apache, S3, etc.) with no server configuration. The build step exists only at author time; deployment is static.

### Developing

```bash
bun install      # install dependencies
bun run dev      # start the Vite dev server (HMR)
bun run build    # produce static files in dist/
bun run preview  # serve the built dist/ locally to smoke-test
```

### The mapping, precisely

The model is a **signed perceptual "feel"** in `[-1, 1]` (the position of a slider), recentered so that baseline is `0`:

- **`feel = 0`** — baseline: it felt exactly as long as it was (1:1). This is the seam between corona and disk.
- **`feel < 0`** — time **dragged** (felt longer). Mapped to the **corona** (red hues), drifting outward toward the edge ("endless") as `feel → -1`.
- **`feel > 0`** — time **flew** (felt shorter). Mapped to the **accretion disk** (purple hues), falling inward toward the event-horizon shadow — the **"zone"** where time vanishes — as `feel → 1`.

Internally, `feel` maps through a log-ratio `F = ln(actual / felt) = tan(feel · π/2 · 0.985)`, and `F` maps to radius via an exponential asymptote. So the singularity is a limit the slider *approaches but never reaches* — you can't type "10000000× faster"; you slide toward the zone. Hue is a stable function of `feel`, so the legend doubles as the color key.

**Input:** each activity is set with a **perceptual slider** (drags ← baseline → flies/zone) rather than a typed number, and the legend shows an evocative descriptor (`feels ~2.3× faster`, `the zone · time vanishes`) instead of raw unbounded multipliers.
