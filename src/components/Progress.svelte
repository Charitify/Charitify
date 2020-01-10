<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let id = undefined
    export let value = 0 // 0 - 100
    export let title = undefined
    export let ariaLabel = undefined

    $: titleProp = title || `Progress - ${value}%`
    $: ariaLabelProp = ariaLabel || `Progress - ${value}%`
    $: classProp = classnames('progress', $$props.class)
</script>


<div
        {id}
        class={classProp}
        title={titleProp}
        aria-label={ariaLabelProp}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={value}
></div>

<style>
</style>
