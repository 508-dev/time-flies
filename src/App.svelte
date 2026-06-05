<script lang="ts">
  import { onMount } from "svelte";
  import { activities } from "./lib/store";
  import { BlackHoleScene, type HoverEvent } from "./lib/scene";
  import { factorToCss, isCorona } from "./lib/mapping";
  import Legend from "./lib/Legend.svelte";

  let container: HTMLDivElement;
  let scene: BlackHoleScene | undefined = $state();
  let hover: HoverEvent | null = $state(null);

  onMount(() => {
    const s = new BlackHoleScene(container);
    s.onHover((h) => (hover = h));
    scene = s;
    return () => s.dispose();
  });

  // Keep the rendered bands in sync with the store.
  $effect(() => {
    const list = $activities;
    scene?.setActivities(list);
  });
</script>

<div class="canvas" bind:this={container}></div>

<Legend onhover={(id) => scene?.setHighlight(id)} />

{#if hover}
  <div class="tooltip" style:left="{hover.clientX}px" style:top="{hover.clientY}px">
    <span class="swatch" style:background={factorToCss(hover.activity.factor)}></span>
    <span class="label">{hover.activity.name}</span>
    <span class="value">
      {hover.activity.factor}× · {isCorona(hover.activity.factor) ? "corona" : "accretion disk"}
    </span>
  </div>
{/if}

<style>
  .canvas {
    position: fixed;
    inset: 0;
    touch-action: none;
  }

  .tooltip {
    position: fixed;
    transform: translate(0.9rem, 0.9rem);
    pointer-events: none;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.6rem;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
    white-space: nowrap;
    font-size: 0.82rem;
  }
  .swatch {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
  }
  .value {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
