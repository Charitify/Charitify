<script>
  export let size = '1em';

  $: foramttedSize = Number.isFinite(+size) ? `${size}px` : typeof size === 'string' ? size : null
</script>

<br style={`padding-bottom: ${foramttedSize}`} class={$$props.class}/>

<style>
  :global(br) {
    display: block;
    height: 0;
    content: "\00a0";
    box-sizing: content-box;
  }

  :global(br.tiny) {
    padding-bottom: calc(1em * 0.29) 0; /* 4px */
  }

  :global(br.small) {
    padding-bottom: calc(1em * 0.57) 0; /* 8px */
  }

  :global(br.medium),
  :global(br) {
    padding-bottom: calc(1em * 1.14) 0; /* 16px */
  }

  :global(br.big) {
    padding-bottom: calc(1em * 2.28) 0; /* 32px */
  }
</style>
