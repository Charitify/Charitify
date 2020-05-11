<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString, _ } from '@utils'
    import Br from '@components/Br.svelte'
    import Checkbox from './Checkbox.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let value = undefined
    export let style = undefined
    export let id = undefined
    export let align = undefined
    export let disabled = false
    export let label = undefined
    export let options = undefined
    export let errors = {}

    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('checkbox-group', $$props.class, { disabled, error: !_.isEmpty(errors) })

    const onChange = ({ detail: { e, name: currName, value: currValue, checked } }) => {
        let newValue = _.cloneDeep(value)

        if (!currName && currValue) {
            if (!Array.isArray(newValue)) {
                newValue = []
            }
            if (checked && !newValue.includes(currValue)) {
                newValue = [...newValue, currValue]
            } else if (!checked && newValue.includes(currValue)) {
                newValue = value.filter(v => v !== currValue)
            }
        } else if (currName) {
            if (!newValue) {
                newValue = {}
            }
            newValue[currName] = currValue || checked
        }

        dispatch('change', { e, name, value: newValue })
    }

    function getChecked(currName, currValue) {
        if (Array.isArray(value)) {
            return value.includes(currValue)
        } else {
            return !!value && value[currName]
        }
    }
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
            errors={errors[checkbox.name]}
            checked={value && getChecked(checkbox.name, checkbox.value)}
            on:change={onChange}
        />
    {/each}
</div>

<style>

</style>
