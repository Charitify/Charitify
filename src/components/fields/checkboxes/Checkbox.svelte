<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let style = {}
    export let checked = undefined
    export let value = undefined
    export let id = undefined
    export let align = undefined
    export let disabled = false
    export let label = undefined
    export let text = undefined
    export let invalid = undefined
    export let form = undefined // Specifies the form the <input> element belongs to
    export let required = undefined // undefined|required
    export let errors = undefined

    $: idProp = id || name || value
    $: error = invalid || !!(errors || []).length
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('checkbox', $$props.class, { disabled, required, error })

    function onChange(e) {
        const value = getValue(e)
        dispatch('change', { e, name, value, checked: e.target.checked })
    }

    function getValue(e) {
        return e.target.value
    }
</script>

<div class={classProp}>
    {#if label}
        <h2 class="text-left">
            { label }
            <Br size="10"/>
        </h2>
    {/if}

    <input
            hidden
            type="checkbox"
            id={idProp}
            {name}
            {form}
            {align}
            {value}
            {checked}
            {disabled}
            {required}
            class="inp-inner"
            on:change={onChange}
    >

    <label for={idProp} class="inp-label">
        <span class="inp-box-wrap">
            <Icon type="box" size="big" is="info" class="unchecked"/>
            <Icon type="box-checked" size="big" is="info" class="checked"/>
        </span>
        {#if text}
            <s></s>
            <s></s>
            <h3 class="font-w-500 text-left" style="padding-top: 4px">{ text }</h3>
        {/if}
    </label>

    <FieldErrors items={errors}>
        <div slot="before">
            <Br size="5"/>
        </div>
    </FieldErrors>
</div>

<style>
    .checkbox {
        display: block;
    }

    .checkbox input {
        appearance: checkbox;
    }

    .checkbox .inp-box-wrap {
        position: relative;
        display: inline-flex;
    }
    .checkbox .inp-inner:checked + .inp-label :global(.checked) {
        display: block;
    }

    .checkbox .inp-label {
        display: flex;
        align-items: flex-start;
    }

    .checkbox .inp-label :global(.checked) {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>
