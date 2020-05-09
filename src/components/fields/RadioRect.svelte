<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Button from '@components/Button.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let style = {}
    export let value = undefined
    export let id = undefined
    export let disabled = false
    export let label = undefined
    export let options = undefined
    export let invalid = undefined
    export let form = undefined // Specifies the form the <input> element belongs to
    export let required = undefined // undefined|required
    export let errors = undefined

    let group = undefined

    $: idProp = id || name
    $: error = invalid || !!(errors || []).length
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('checkbox', $$props.class, { disabled, required, error })
</script>

<div class={classProp} style={styleProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    {#each options as radio}
        <Button htmlFor={idProp}>
            <input 
                {form}
                {value}
                type="radio" 
                id={idProp} 
                bind:group={group}
            >
            {radio.label}
        </Button>
    {/each}

</div>