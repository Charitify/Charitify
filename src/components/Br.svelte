<script>
  export let size = '1em';

  $: foramttedSize = Number.isFinite(+size) ? `${size}px` : typeof size === 'string' ? size : null
</script>

<br style={`margin-top: ${foramttedSize}`} class={$$props.class}/>

<style>
  :global(br) {
    display: block;
    height: 0;
    content: "\00a0";
    box-sizing: content-box;
  }

  :global(br.tiny) {
    margin-top: calc(1em * 0.29); /* 4px */
  }

  :global(br.small) {
    margin-top: calc(1em * 0.57); /* 8px */
  }

  :global(br.medium),
  :global(br) {
    margin-top: calc(1em * 1.14); /* 16px */
  }

  :global(br.big) {
    margin-top: calc(1em * 2.28); /* 32px */
  }
</style>
