<script>
    import { classnames } from '@utils'

    export let active = false
    export let visible = true
    export let mounted = false

    let isMounted = mounted

    $: classProp = classnames('lazy-toggle flex-1', $$props.class, { hidden: !active, invisible: !visible })
    $: if (active && !isMounted) isMounted = true
</script>

<section class={classProp}>
    {#if isMounted}
        <slot></slot>
    {/if}
</section>

<style>
    .lazy-toggle.hidden {
        display: none;
    }

    .lazy-toggle.invisible {
        visibility: hidden;
    }
</style>