<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'

    const dispatch = createEventDispatcher()

    export let name
    export let id = undefined
    export let title = undefined
    export let ariaLabel = undefined
    export let autocomplete = true

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title
    let autocompleteProp = autocomplete ? 'on' : 'off'

    $: classProp = classnames('form', $$props.class)
</script>

<form
        {id}
        {name}
        title={titleProp}
        class={classProp}
        aria-label={ariaLabelProp}
        autocomplete={autocompleteProp}
        on:submit|preventDefault={e => dispatch('submit', e)}
>
    <slot></slot>
</form>

<style>

</style>
