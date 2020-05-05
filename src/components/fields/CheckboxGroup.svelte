<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let value = ''
    export let style = {}
    export let id = undefined
    export let align = undefined
    export let disabled = false
    export let label = undefined
    export let invalid = undefined
    export let form = undefined // Specifies the form the <input> element belongs to
    export let required = undefined // undefined|required
    export let errors = undefined

    $: idProp = id || name
    $: titleProp = label || ariaLabel
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('checkbox', $$props.class, { disabled, required, invalid })
</script>

<div class={classProp}>
    <h2>{ titleProp }</h2>
    <input
            type="checkbox"
            id={idProp}
            {name}
            {form}
            {align}
            {disabled}
            {required}
            bind:value
    >

    <label for={idProp}>
        { titleProp }
        <Br size="10"/>
    </label>

    <FieldErrors items={errors}>
        <div slot="before">
            <Br size="5"/>
        </div>
    </FieldErrors>
</div>

<style>

</style>
