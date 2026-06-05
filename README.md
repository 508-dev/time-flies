# time-flies
Submission to Long Now Foundation's "Book of Time," 02026


# Spec


This application demonstrates a prototype of a method of thinking about time. Time on Earth is measured against the "constant" of atomic time (or similar) measured at altitude 0. Entities at higher altitudes that are thus experiencing "higher velocities" thus experience time slightly differently, and must "reset" their time measuring devices upon returning to altitude 0. Thus, and thanks to Einstein, we know that in reality, time is a relative concept, but measurable.

Time can still be immeasurably relative: biological sentient entities have a sense for time, but it's inaccurate compared to e.g. atomic or even simple clocks, and furthermore, for a given sentient entity, changes its compression factor moment to moment. A simple example is demonstrated by the adage "time flies when you're having fun." One hour to a human waiting in a doctor's office "feels a lot longer" than one hour of playing basketball to a human that enjoys doing so. Time compression also differs significantly from individual to individual in the same situation. Twenty minutes feels very different to humans of the same age in the same restaurant, when one human is the one hungry and waiting for their meal, and the other human is the one in the kitchen preparing that meal alongside ten other meals while being shouted at by an angry chef. Similarly, ten minutes feels very different to the adult human driving a car than it does to the child human riding in it.

There are thus many mechanisms that can affect "time compression factor," experience of time as compared to a physical constant representation at altitude 0. Age (relative duration of time against total experiences), expectation (looking forward to / dreading an upcoming event at a known time), desire (hunger, lust), boredom or lack thereof, and all the other phenomenological aspects that comprise sentience.

The goal of this project is to take a slice of this and represent it visually on a 2d plane (a computer, tablet, or phone screen). The project will intake several human activities, ask the user their subjective interpretation of time during those activities, and then represent those activities against a 3d graph that's roughly in the shape of the most modern human consensual understanding of a black hole as of 02026 (popularized in the film "Interstellar (02014)"). 

In this graph, time compression factors will map against theorized compression factors of entities orbiting and falling into a black hole. Objects in the outer orbit of the black hole (the "corona") will experience a low compression factor: they are experienced at compression factors of less than 1, or at 1, so for example, if waiting in a dentist office for an hour "feels like forever," this would be a compression factor of 3.0, wherein one hour feels like three hours. If waiting at a traffic light for one minute feels like one minute, that is a compression factor of 1. Such an activity will be depicted as close to the inner edge of the "corona." 

Activities with a compression factor of less than 1 are closing in on the event horizon of the black hole. They aren't depicted on the "corona" of the black hole but instead as part of the brighter "acretion disk." Technical [depictions](https://science.nasa.gov/universe/black-holes/anatomy/) don't differentiate the corona and acretion disk by color, but this app does for the sake of the visualization. Unlike the corona, the acretion disk will experience the distinct gravitational lensing effect that causes the disk behind the black hole to be visible above and below it as a highly smeared "bump." The lower the compression factor (the "shorter" an activity feels relative to atomic time at altitude 0), the closer to the event horizon shadow the activity is depicted.

The corona is hues of red, and the acretion disk is hues of purple. Exact hue can be mapped to a legend of activities. Also, the user can hover their cursor over a disk, or on mobile, tap it, to view a tooltip of whic activity that band of color represents. 

In the legend is a "plus" button to allow adding a new activity. An activity is represented by a name (string), and a compression factor (float). After changing the compression factor, an activity is automatically sorted in the legend list, with a color assigned. Hue is relative in a constant manner to compression factor, so a compression factor of 1.3 will always have the same hue, even if multiple activities have that compression factor.


## Technical Specifications

This is a single-page app designed to render on web browsers with javascript enabled. Non-javascript browsers are shown a notice asking them to enable javascript.

The app is built with a toolchain, but the **output** is a set of plain static files (`dist/`) — hashed HTML, JS, and CSS — that can be served from any static host (GitHub Pages, Apache, S3, etc.) with no server configuration. The build step exists only at author time; deployment is static.

### Decisions made

These resolve the open questions from the original spec.

1. **Framework & build tooling.** We use a framework with a build step rather than vanilla JS + CDNs. The WebGL shader work and the interactive legend benefit from real components and type safety.
   - **Svelte** (v5) for UI components (the legend, tooltips, the add/edit controls).
   - **TypeScript** throughout.
   - **Vite** (v8) as the dev server and bundler, via the official Svelte plugin, producing the static `dist/` output.
   - **Bun** as the package manager and script runner (`bun install`, `bun run dev`, `bun run build`). Bun runs Vite; Vite owns Svelte compilation (the most battle-tested path for `.svelte` files).
2. **Graphing / rendering library.** **Three.js** (WebGL). The black hole is rendered as a 3D scene with a custom GLSL fragment shader that approximates gravitational lensing — the accretion disk warping up and over the event-horizon shadow, Interstellar-style. (`d3`/`plotly` were considered but can't produce the lensing effect.)

### Other decisions

- **Persistence:** activities are stored in `localStorage` and persist across reloads. The app ships seeded with example activities on first load.
- **Camera:** orbitable — drag to rotate, scroll/pinch to zoom (Three.js `OrbitControls`).

### Build approach

To keep a hard deadline safe, the app is built in protective layers, each one independently shippable:

1. **Scaffold + toolchain baseline** — Bun/Vite/Svelte/TS + Three.js, build verified.
2. **Conceptual core** — data model, persistence, legend (add/edit/delete, sorted, colored), factor→radius and factor→hue mapping, activities rendered as colored bands around a dark sphere, tooltips, orbit camera. *This layer alone is a complete, submittable prototype.*
3. **Gravitational lensing shader** — upgrade the visual to the lensed accretion disk, layered so it can degrade gracefully to Layer 2's render.
4. **Polish** — mobile/tap behavior, responsive layout, final build and static-serve check.

### Developing

```bash
bun install      # install dependencies
bun run dev      # start the Vite dev server (HMR)
bun run build    # produce static files in dist/
bun run preview  # serve the built dist/ locally to smoke-test
```

### The mapping, precisely

- **Compression factor ≥ 1** → the **corona** (red hues). Factor `1` sits at the inner edge of the corona; larger factors ("feels like forever") sit further out.
- **Compression factor < 1** → the **accretion disk** (purple hues). The lower the factor ("felt shorter than it was"), the closer to the event-horizon shadow.
- **Hue is a stable function of the compression factor** — a given factor always maps to the same hue, regardless of which/how many activities share it. The legend doubles as the color key.
