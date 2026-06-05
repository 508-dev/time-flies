<script lang="ts">
  import { activities } from "./store";
  import { factorToCss, isCorona } from "./mapping";
  import type { Activity } from "./types";

  let { onhover }: { onhover?: (id: string | null) => void } = $props();

  // Sorted outermost-first: largest factor (felt longest) at the top, sinking
  // toward the event horizon as factors shrink.
  let sorted = $derived([...$activities].sort((a, b) => b.factor - a.factor));

  let adding = $state(false);
  let newName = $state("");
  let newFactor = $state(1.0);

  function commitName(a: Activity, value: string) {
    const name = value.trim();
    if (name && name !== a.name) activities.edit(a.id, { name });
  }

  function commitFactor(a: Activity, value: string) {
    const factor = Number.parseFloat(value);
    if (Number.isFinite(factor) && factor > 0 && factor !== a.factor) {
      activities.edit(a.id, { factor });
    }
  }

  function submitNew() {
    const name = newName.trim();
    if (name && Number.isFinite(newFactor) && newFactor > 0) {
      activities.add(name, newFactor);
    }
    newName = "";
    newFactor = 1.0;
    adding = false;
  }
</script>

<aside class="legend">
  <header>
    <h1>time flies</h1>
    <p class="sub">subjective time, mapped to a black hole</p>
  </header>

  <ul>
    {#each sorted as a (a.id)}
      <li
        role="presentation"
        onpointerenter={() => onhover?.(a.id)}
        onpointerleave={() => onhover?.(null)}
      >
        <span class="swatch" style:background={factorToCss(a.factor)}></span>
        <input
          class="name"
          value={a.name}
          aria-label="Activity name"
          onchange={(e) => commitName(a, e.currentTarget.value)}
        />
        <input
          class="factor"
          type="number"
          min="0.01"
          step="0.05"
          value={a.factor}
          aria-label="Compression factor"
          onchange={(e) => commitFactor(a, e.currentTarget.value)}
        />
        <span class="zone" class:corona={isCorona(a.factor)}>
          {isCorona(a.factor) ? "corona" : "disk"}
        </span>
        <button class="remove" aria-label="Remove activity" onclick={() => activities.remove(a.id)}>
          ×
        </button>
      </li>
    {/each}
  </ul>

  {#if adding}
    <form class="add-form" onsubmit={(e) => (e.preventDefault(), submitNew())}>
      <!-- svelte-ignore a11y_autofocus -->
      <input class="name" placeholder="Activity name" bind:value={newName} autofocus />
      <input class="factor" type="number" min="0.01" step="0.05" bind:value={newFactor} />
      <button type="submit" class="confirm" aria-label="Add activity">✓</button>
      <button type="button" class="remove" aria-label="Cancel" onclick={() => (adding = false)}>×</button>
    </form>
  {:else}
    <button class="add" onclick={() => (adding = true)}>+ add activity</button>
  {/if}

  <footer>
    <span>red corona · felt longer (≥ 1×)</span>
    <span>purple disk · felt shorter (&lt; 1×)</span>
  </footer>
</aside>

<style>
  .legend {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: min(22rem, calc(100vw - 2rem));
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
    gap: 0.3rem;
    overflow-y: auto;
  }

  li {
    display: grid;
    grid-template-columns: 0.8rem 1fr 3.2rem auto auto;
    align-items: center;
    gap: 0.45rem;
    padding: 0.2rem 0.1rem;
    border-radius: 0.4rem;
  }
  li:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .swatch {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
  }

  input {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.3rem;
    color: var(--fg);
    font: inherit;
    font-size: 0.82rem;
    padding: 0.2rem 0.3rem;
    min-width: 0;
  }
  input:hover {
    border-color: var(--panel-border);
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
    background: rgba(0, 0, 0, 0.3);
  }
  .factor {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .zone {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c9a3ff;
  }
  .zone.corona {
    color: #ff9b7a;
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
    font-size: 1rem;
    line-height: 1;
    padding: 0.1rem 0.3rem;
    border-radius: 0.3rem;
  }
  .remove:hover {
    color: #ff8080;
    background: rgba(255, 80, 80, 0.12);
  }
  .confirm:hover {
    color: #7affa0;
    background: rgba(122, 255, 160, 0.12);
  }

  .add-form {
    display: grid;
    grid-template-columns: 1fr 3.2rem auto auto;
    align-items: center;
    gap: 0.45rem;
  }
  .add-form input {
    border-color: var(--panel-border);
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
    gap: 0.1rem;
    color: var(--muted);
    font-size: 0.66rem;
    letter-spacing: 0.03em;
    border-top: 1px solid var(--panel-border);
    padding-top: 0.5rem;
  }
</style>
