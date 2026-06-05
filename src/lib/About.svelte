<script lang="ts">
  let open = $state(false);
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && (open = false)} />

<button class="fab" aria-label="About this project" onclick={() => (open = true)}>
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6" />
    <circle cx="12" cy="7.4" r="1.3" fill="currentColor" />
    <rect x="11" y="10.5" width="2" height="7" rx="1" fill="currentColor" />
  </svg>
</button>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={(e) => e.target === e.currentTarget && (open = false)}
  >
    <div class="modal" role="dialog" aria-modal="true" aria-label="About time flies" tabindex="-1">
      <button class="close" aria-label="Close" onclick={() => (open = false)}>×</button>
      <div class="content">
        <h2>time flies</h2>

        <p>
          This application demonstrates a method of thinking about the subjective experience of
          time, and how that can change for an individual based on the activity the individual is
          doing.
        </p>
        <p>
          In 01938, Herbert E. Ives and G. R. Stilwell demonstrated the existence of relativistic
          time dilation, providing physical proof of the relativity of time. Relative time can be
          used as a metaphor for the subjective experience of time: individuals have a sense for
          time, but it's inaccurate compared to even simple clocks, and changes moment to moment. An
          example is demonstrated by the adage "time flies when you're having fun." One hour waiting
          in a doctor's office "feels longer" than one hour of playing basketball. Thirty minutes
          feels different between a human that is hungry and waiting for their meal than it does to
          the human preparing it while being shouted at by an angry chef. Ten minutes feels
          different to a parent driving a car and the child riding in it.
        </p>
        <p>
          "Time Flies" represents this subjective elasticity of time as a visual metaphor in the
          form of a contemporary depiction of a black hole as popularized in the 02014 film
          "Interstellar". Users indicate whether an activity "dragged" or "flew," which causes an
          activity to be placed further away from (time dragged) or closer to (time flew) the black
          hole. This maps to the reality of relativistic time: faster acceleration, or close
          proximity to a black hole, cause an individual to experience "less time" than a slower
          reference.
        </p>
        <p>
          "The Zone" is a state of experience where time "falls away" and an individual becomes one
          with an activity. This is a singularity, a place outside of time and individual
          experience, where the ego has dissolved, a subjective factor of infinity. This is
          invisible to the outside world, just as the outside world is invisible to the individual
          when they're "in the zone," and so this is represented by the event horizon. This captures
          the paradox of subjective time elasticity, wherein though time "flies" when in the zone,
          it somehow feels like a more dense experience, as if the time had higher surface area.
        </p>
        <p>
          In order to service the metaphor, the "reference time" is set within the orbit of the
          black hole, between the corona (outer orbit) and accretion disk (inner orbit).
        </p>
        <p>
          As a user lists activities and their expansion ratios, the hope is that individuals will
          have a better understanding of the kind of activities that can get them close to, or into,
          "the zone." It's a tool to help users recognize what activities bring them frustration and
          boredom, and what activities bring them absorption and fulfillment. It's meant to help
          users increase the surface area of their existence.
        </p>

        <h3>Affiliations &amp; Community</h3>
        <p>
          This project was built with the cooperation and resources of
          <a href="https://blog.508.dev" target="_blank" rel="noopener">508.dev</a>, a software
          engineering co-op. 508.dev is a non-traditional software development firm that prioritizes
          members over profits, and can be found on Mastodon at @508dev@techhub.social.
        </p>
        <p>
          The developer is Caleb Rogers, who can be found on Mastodon at @komali_2@mastodon.social,
          or at <a href="https://blog.calebjay.com" target="_blank" rel="noopener">blog.calebjay.com</a>.
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .fab {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 20;
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--fg);
    background: var(--panel);
    border: 1px solid var(--panel-border);
    backdrop-filter: blur(12px);
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
  }
  .fab:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgba(0, 0, 2, 0.6);
    backdrop-filter: blur(4px);
  }

  .modal {
    position: relative;
    width: min(34rem, 100%);
    max-height: 82vh;
    overflow-y: auto;
    padding: 1.75rem 1.75rem 1.5rem;
    background: rgba(10, 8, 20, 0.92);
    border: 1px solid var(--panel-border);
    border-radius: 0.9rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  }

  .close {
    position: absolute;
    top: 0.6rem;
    right: 0.75rem;
    background: transparent;
    border: none;
    color: var(--muted);
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 0.3rem;
  }
  .close:hover {
    color: var(--fg);
    background: rgba(255, 255, 255, 0.08);
  }

  .content h2 {
    font-weight: 400;
    font-size: 1.25rem;
    letter-spacing: 0.06em;
    text-transform: lowercase;
    margin: 0 0 0.75rem;
    color: var(--fg);
  }
  .content h3 {
    font-weight: 500;
    font-size: 0.95rem;
    margin: 1.2rem 0 0.4rem;
    color: var(--accent);
  }
  .content p {
    margin: 0 0 0.7rem;
    font-size: 0.86rem;
    line-height: 1.6;
    color: #cfc9e0;
  }
  .content a {
    color: var(--accent);
    text-underline-offset: 2px;
  }

  @media (max-width: 480px) {
    .backdrop {
      padding: 0;
    }
    .modal {
      width: 100%;
      height: 100%;
      max-height: 100%;
      border: none;
      border-radius: 0;
      padding: 3rem 1.25rem 1.5rem;
    }
  }
</style>
