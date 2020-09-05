<script>
  import { onMount } from "svelte";

  export let id = undefined
  export let off = false

  let ref;
  let portal;

  onMount(() => {
    if (off) return
    const prevPortal = document.getElementById(`portal_${id}`)
    if (id && prevPortal) document.body.removeChild(prevPortal);
    portal = document.createElement("div");
    portal.className = "portal";
    portal.id = `portal_${id}`;
    portal.appendChild(ref);
    document.body.appendChild(portal);
    return () => document.body.removeChild(portal)
  });

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
