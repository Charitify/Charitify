<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let value = ''
    export let style = {}
    export let type = 'select'
    export let id = undefined
    export let align = undefined
    export let disabled = false
    export let label = undefined
    export let invalid = undefined
    export let form = undefined // Specifies the form the <input> element belongs to
    export let readonly = undefined // undefined|readonly
    export let required = undefined // undefined|required
    export let ariaLabel = undefined
    export let placeholder = undefined
    export let errors = undefined
    /**
     *
     * @type {{
     *     value: string,
     *     label: string,
     * }[]}
     */
    export let options = []

    $: idProp = id || name
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('select', $$props.class, { disabled, readonly, required, invalid })
</script>

{#if titleProp}
    <label for={idProp} class="block h2 font-w-500 full-width text-left">
        { titleProp }
    </label>
    <Br size="10"/>
{/if}

<select
        {name}
        {type}
        {form}
        {align}
        {readonly}
        {disabled}
        {required}
        {placeholder}
        id={idProp}
        class={classProp}
        title={titleProp}
        style={styleProp}
        aria-label={ariaLabelProp}
        bind:value
        on:blur='{e => !disabled && dispatch("blur", e)}'
        on:focus='{e => !disabled && dispatch("focus", e)}'
>
    {#each options as option}
        {#if option.value !== undefined && option.label !== undefined}
            <option value={option.value}>{option.label}</option>
        {/if}
    {/each}
</select>

<FieldErrors items={errors}/>

<style>
    .select {
        width: 100%;
        flex: 1 1 0;
        color: inherit;
        border-radius: var(--border-radius-small);
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
        box-shadow: var(--shadow-field-inset);
        background-color: rgba(var(--theme-bg-color));
    }

    .inp::placeholder {
        color: rgba(var(--theme-color-primary-opposite));
        opacity: .2;
    }
</style>
