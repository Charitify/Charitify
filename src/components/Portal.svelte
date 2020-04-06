<script>
  import { onMount } from "svelte";
  let ref;
  let portal;
  let portalWrapper;

  onMount(() => {
    portalWrapper = document.getElementById("portal");
    if (!portalWrapper) {
        portalWrapper = document.createElement("div");
        portalWrapper.id = 'portal'
        document.body.appendChild(portalWrapper);
    }
    portal = document.createElement("div");
    portal.className = "portal";
    portalWrapper.appendChild(portal);
    portal.appendChild(ref);
    return () => portalWrapper.removeChild(portal)
  });

</script>

<div class="portal-clone">
    <div bind:this={ref}>
        <slot />
    </div>
</div>

<style>
  .portal-clone {
    display: none;
  }
</style>
