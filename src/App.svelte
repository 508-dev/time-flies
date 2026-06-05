<script lang="ts">
  import { onMount } from "svelte";
  import { activities } from "./lib/store";
  import { BlackHoleScene, type HoverEvent } from "./lib/scene";
  import { feelToCss, feelDescriptor, zoneLabel } from "./lib/mapping";
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

  // Position the tooltip near the pointer but clamped inside the viewport, so a
  // tap on a band near a screen edge (mobile) stays fully visible.
  let tip = $derived.by(() => {
    if (!hover) return null;
    const w = 240;
    const h = 52;
    const pad = 12;
    const left = Math.max(pad, Math.min(hover.clientX + 14, window.innerWidth - w - pad));
    const top = Math.max(pad, Math.min(hover.clientY + 14, window.innerHeight - h - pad));
    return { left, top };
  });
</script>

<div class="canvas" bind:this={container}></div>

<Legend onhover={(id) => scene?.setHighlight(id)} />

{#if hover && tip}
  <div class="tooltip" style:left="{tip.left}px" style:top="{tip.top}px">
    <span class="swatch" style:background={feelToCss(hover.activity.feel)}></span>
    <span class="label">{hover.activity.name}</span>
    <span class="value">
      {feelDescriptor(hover.activity.feel)} · {zoneLabel(hover.activity.feel)}
    </span>
  </div>
{/if}

<style>
  .canvas {
    position: fixed;
    inset: 0;
    touch-action: none;
  }
  /* Display the canvas at the container's size; the WebGL drawing buffer stays
     at full (HiDPI) resolution via renderer.setSize, decoupled from CSS size. */
  .canvas :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .tooltip {
    position: fixed;
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
