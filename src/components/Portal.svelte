<script>
  import { onMount } from "svelte";

  export let off

  let ref;
  let portal;

  onMount(off ? (() => {}) : (() => {
    portal = document.createElement("div");
    portal.className = "portal";
    portal.appendChild(ref);
    document.body.appendChild(portal);
    return () => document.body.removeChild(portal)
  }));

</script>

{#if off}
  <slot />
{:else}
  <div class="portal-clone">
      <div bind:this={ref}>
          <slot />
      </div>
  </div>
{/if}

<style>
  .portal-clone {
    display: none;
  }
</style>
