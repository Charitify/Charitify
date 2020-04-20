<script>
  import { Br } from "@components";

  export let src
</script>

<h1>3D - Тур 360°</h1>
<Br size="20" />
<div class="full-container">
  <iframe
    {src}
    title="360 тур"
    width="100%"
    height="450"
    frameborder="0"
    style="border:0;"
    allowfullscreen=""
    aria-hidden="false"
    tabindex="0" ></iframe>
</div>

<style>
    div {
        background-color: rgba(var(--theme-bg-color-opposite), .04);
    }
</style>
