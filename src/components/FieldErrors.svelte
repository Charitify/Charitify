<script>
    import { slide } from 'svelte/transition';

    export let items

    $: list = [].concat(items || []).slice(0, 1).filter(Boolean)
</script>

{#if list && list.length}
    <slot name="before"></slot>
    <ul class={`font-primary font-w-500 h4 text-danger text-left ${$$props.class || ''}`}>
        {#each list as item}
            <li in:slide>* {item}</li>
        {/each}
    </ul>
    <slot name="after"></slot>
{/if}
