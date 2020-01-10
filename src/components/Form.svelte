<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '../utils'

    const dispatch = createEventDispatcher()

    export let name
    export let id = undefined
    export let title = undefined
    export let style = undefined
    export let ariaLabel = undefined
    export let autocomplete = false

    $: options = {
        id,
        name,
        title,
        'aria-label': ariaLabel,
        style: toCSSString(style),
        class: classnames('ico', $$props.class),
        autocomplete: autocomplete ? 'on' : 'off',
    }

    function onSubmit(e) {
        e.preventDefault()
        dispatch('submit', e)
    }
</script>

<form on:submit={onSubmit}>
    <slot></slot>
</form>

<style>

</style>
