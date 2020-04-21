<script>
  import { Picture, Button, Loader } from "@components";

  export let id = null
  export let src = null
  export let title = null
</script>

<Button rel="prefetch" href={id} class="white">
  <div class="flex flex-align-center flex-justify-between full-width">

    <div class="flex flex-align-center">
      <s />
      <div class="flex" style="max-width: 45px; height: 40px; overflow: hidden">
        <Picture
          {src}
          size="contain"
          alt="якесь фото організації" />
      </div>
      <s />
      {#if title !== null}
        <s />
        <s />
        <h3>{title}</h3>
      {:else}
        <span><Loader type="h3"/></span>
      {/if}
    </div>
    
  </div>
</Button>
