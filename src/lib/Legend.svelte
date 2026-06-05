<script lang="ts">
  import { activities } from "./store";
  import { feelToCss, feelDescriptor, isCorona, isBaseline } from "./mapping";
  import type { Activity } from "./types";

  let { onhover }: { onhover?: (id: string | null) => void } = $props();

  let adding = $state(false);
  let newName = $state("");
  let newFeel = $state(0);

  // Activities stay in the order they were added — no auto-sort, so rows never
  // shuffle out from under the pointer as the user drags a slider.
  function commitName(a: Activity, value: string) {
    const name = value.trim();
    if (name && name !== a.name) activities.edit(a.id, { name });
  }

  function commitFeel(a: Activity, value: string) {
    const feel = Number.parseFloat(value);
    if (Number.isFinite(feel)) activities.edit(a.id, { feel: Math.max(-1, Math.min(1, feel)) });
  }

  function submitNew() {
    const name = newName.trim();
    if (name) activities.add(name, Math.max(-1, Math.min(1, newFeel)));
    newName = "";
    newFeel = 0;
    adding = false;
  }
</script>

<aside class="legend">
  <header>
    <h1>time flies</h1>
    <p class="sub">subjective time, mapped to a black hole</p>
  </header>

  <ul>
    {#each $activities as a (a.id)}
      <li
        role="presentation"
        onpointerenter={() => onhover?.(a.id)}
        onpointerleave={() => onhover?.(null)}
      >
        <div class="row-top">
          <span class="swatch" style:background={feelToCss(a.feel)}></span>
          <input
            class="name"
            value={a.name}
            aria-label="Activity name"
            onchange={(e) => commitName(a, e.currentTarget.value)}
          />
          <button class="remove" aria-label="Remove activity" onclick={() => activities.remove(a.id)}>
            ×
          </button>
        </div>
        <div class="row-bottom">
          <input
            class="feel"
            type="range"
            min="-1"
            max="1"
            step="0.001"
            value={a.feel}
            aria-label="How time felt — drag left for drags, right for flies"
            oninput={(e) => commitFeel(a, e.currentTarget.value)}
          />
          <span
            class="desc"
            class:corona={isCorona(a.feel)}
            class:base={isBaseline(a.feel)}
          >
            {feelDescriptor(a.feel)}
          </span>
        </div>
      </li>
    {/each}
  </ul>

  {#if adding}
    <form class="add-form" onsubmit={(e) => (e.preventDefault(), submitNew())}>
      <!-- svelte-ignore a11y_autofocus -->
      <input class="name" placeholder="Activity name" bind:value={newName} autofocus />
      <div class="row-bottom">
        <input class="feel" type="range" min="-1" max="1" step="0.001" bind:value={newFeel} />
        <span class="desc" class:corona={isCorona(newFeel)} class:base={isBaseline(newFeel)}>
          {feelDescriptor(newFeel)}
        </span>
      </div>
      <div class="add-actions">
        <button type="submit" class="confirm" aria-label="Add activity">✓ add</button>
        <button type="button" class="remove" aria-label="Cancel" onclick={() => (adding = false)}>×</button>
      </div>
    </form>
  {:else}
    <button class="add" onclick={() => (adding = true)}>+ add activity</button>
  {/if}

  <footer>
    <span>← time drags (feels longer) | time flies (feels shorter) →</span>
    <span>built by <a href="https://calebjay.com">Caleb</a>, and is <a href="https://github.com/508-dev/time-flies#">FOSS</a></span>
  </footer>
</aside>

<style>
  .legend {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: min(23rem, calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 0.9rem;
    backdrop-filter: blur(12px);
    overflow: hidden;
  }

  header h1 {
    margin: 0;
    font-weight: 300;
    font-size: 1.4rem;
    letter-spacing: 0.18em;
    text-transform: lowercase;
  }
  .sub {
    margin: 0.15rem 0 0;
    color: var(--muted);
    font-size: 0.74rem;
    letter-spacing: 0.04em;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    /* Always-visible scrollbar so it's obvious more activities lie below. */
    overflow-y: scroll;
    scrollbar-width: thin;
    scrollbar-color: rgba(182, 156, 255, 0.6) transparent;
  }
  ul::-webkit-scrollbar {
    width: 8px;
  }
  ul::-webkit-scrollbar-track {
    background: transparent;
  }
  ul::-webkit-scrollbar-thumb {
    background: rgba(182, 156, 255, 0.55);
    border-radius: 4px;
  }

  li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.35rem 0.3rem;
    border-radius: 0.45rem;
  }
  li:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .row-top {
    display: grid;
    grid-template-columns: 0.8rem 1fr auto;
    align-items: center;
    gap: 0.45rem;
  }
  .row-bottom {
    display: grid;
    grid-template-columns: 1fr 7.5rem;
    align-items: center;
    gap: 0.5rem;
    padding-left: 1.25rem;
  }

  .swatch {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
  }

  .name {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.3rem;
    color: var(--fg);
    font: inherit;
    font-size: 0.85rem;
    padding: 0.2rem 0.3rem;
    min-width: 0;
  }
  .name:hover {
    border-color: var(--panel-border);
  }
  .name:focus {
    outline: none;
    border-color: var(--accent);
    background: rgba(0, 0, 0, 0.3);
  }

  /* Slider styled as a "drags ← baseline → flies" track. */
  .feel {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      hsl(0 95% 55%),
      hsl(30 90% 55%) 35%,
      #6b6480 50%,
      hsl(300 85% 60%) 65%,
      hsl(258 85% 62%)
    );
    outline: none;
    cursor: pointer;
  }
  .feel::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #1a1726;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
  }
  .feel::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #1a1726;
  }

  .desc {
    font-size: 0.66rem;
    letter-spacing: 0.02em;
    text-align: right;
    color: #c9a3ff;
    font-variant-numeric: tabular-nums;
  }
  .desc.corona {
    color: #ff9b7a;
  }
  .desc.base {
    color: var(--muted);
  }

  button {
    cursor: pointer;
    font: inherit;
  }
  .remove,
  .confirm {
    background: transparent;
    border: none;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1;
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
  }
  .remove:hover {
    color: #ff8080;
    background: rgba(255, 80, 80, 0.12);
  }
  .confirm {
    color: #9affb8;
  }
  .confirm:hover {
    background: rgba(122, 255, 160, 0.12);
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border: 1px dashed var(--panel-border);
    border-radius: 0.55rem;
    padding: 0.5rem;
  }
  .add-form .name {
    border-color: var(--panel-border);
  }
  .add-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.3rem;
  }

  .add {
    background: transparent;
    border: 1px dashed var(--panel-border);
    color: var(--accent);
    border-radius: 0.5rem;
    padding: 0.4rem;
    letter-spacing: 0.05em;
  }
  .add:hover {
    background: rgba(182, 156, 255, 0.1);
  }

  footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    color: var(--muted);
    font-size: 0.64rem;
    letter-spacing: 0.02em;
    border-top: 1px solid var(--panel-border);
    padding-top: 0.5rem;
  }

  @media (max-width: 480px) {
    .legend {
      top: 0.5rem;
      left: 0.5rem;
      width: calc(100vw - 1rem);
      max-height: 38vh;
      padding: 0.75rem;
      gap: 0.4rem;
    }
    header h1 {
      font-size: 1.2rem;
    }
  }
</style>
