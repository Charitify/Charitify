<script>
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Checkbox from './Checkbox.svelte'

    export let value = ''
    export let style = {}
    export let id = undefined
    export let align = undefined
    export let disabled = false
    export let label = undefined
    export let options = undefined
    export let errors = undefined

    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('checkbox-group', $$props.class, { disabled })
</script>

<div {id} class={classProp} styleProp={styleProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    {#each options as checkbox, i}
        {#if i}
            <Br size="15"/>
        {/if}
        <Checkbox 
            {...checkbox}
            value={value[checkbox.name]}
            errors={errors[checkbox.name]}
        />
    {/each}
</div>

<style>

</style>
