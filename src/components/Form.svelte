<script>
    export let name = undefined
    export let id = undefined
    export let title = undefined
    export let ariaLabel = undefined
    export let method = undefined
    export let autocomplete = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title
</script>

<form
        {id}
        {name}
        {method}
        {autocomplete}
        title={titleProp}
        class={$$props.class}
        aria-label={ariaLabelProp}
        on:submit|preventDefault
>
    <slot></slot>
</form>

<style>

</style>
