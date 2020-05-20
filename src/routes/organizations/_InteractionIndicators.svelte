<script>
  import { createEventDispatcher } from "svelte";
  import { Icon, Button, Loader } from "@components";

  const dispatch = createEventDispatcher()

  export let likes = null;
  export let views = null;
  export let isLiked = false;
</script>

<p class="container flex flex-justify-between flex-align-center">
  <Button 
    class="flex flex-align-center" 
    auto
    size="small"
    style={`opacity: ${isLiked ? 1 : .5}`}
    on:click={() => dispatch('click', !isLiked)}
>
    <Icon is="danger" type="heart" size="medium" />
    <s />
    <s />
    {#if likes !== null}
      <span class="font-secondary font-w-600 h3">{likes}</span>
    {:else}
      <span class="font-secondary font-w-600 h3 relative">
        <span style="visibility: hidden">199</span>
        <Loader type="h3" absolute/>
      </span>  
    {/if}
  </Button>

  <span class="flex">
    <Button class="flex flex-align-center" auto size="small">
      <Icon type="share" size="medium" class="theme-svg-fill" />
      <s />
      <s />
      <h3 class="font-w-600">Поділитись</h3>
    </Button>
  </span>
  <span class="flex flex-align-center">
    <Icon type="eye" size="medium" class="theme-svg-fill" />
    <s />
    <s />
    {#if views !== null}
      <span class="font-secondary font-w-600 h3">{views}</span>
    {:else}
      <span class="font-secondary font-w-600 h3 relative">
        <span style="visibility: hidden">199</span>
        <Loader type="h3" absolute/>
      </span>  
    {/if}
  </span>
</p>
