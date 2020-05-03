<script>
    import { classnames } from '@utils'

    export let name = undefined
    export let id = undefined
    export let title = undefined
    export let ariaLabel = undefined
    export let method = 'post'
    export let autocomplete = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title

    $: classProp = classnames('form', $$props.class)
</script>

<form
        {id}
        {name}
        {method}
        {autocomplete}
        title={titleProp}
        class={classProp}
        aria-label={ariaLabelProp}
        on:submit|preventDefault
>
    <slot></slot>
</form>

<style>

</style>
