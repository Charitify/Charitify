<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let value = ''
    export let style = {}
    export let type = 'text'
    export let id = undefined
    export let align = undefined
    export let minlength = 0
    export let maxlength = 1000
    export let rows = undefined
    export let disabled = false
    export let label = undefined
    export let invalid = undefined
    export let min = undefined // Specifies a minimum value for an <input> element
    export let max = undefined // Specifies the maximum value for an <input> element
    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element
    export let form = undefined // Specifies the form the <input> element belongs to
    export let readonly = undefined // undefined|readonly
    export let required = undefined // undefined|required
    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)
    export let autocomplete = true // on|off
    export let autoselect = false
    export let ariaLabel = undefined
    export let placeholder = undefined
    export let errors = undefined

    $: idProp = id || name
    $: typeProp = type === 'number' ? 'text' : type
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: autocompleteProp = autocomplete ? 'on' : 'off'
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern
    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })

    /**
     *
     * @description Emit click and select content when "autoselect" is enabled.
     *
     * @param {MouseEvent} e - Native mouse event.
     */
    function onClick(e) {
        !disabled && dispatch("click", e)
        !disabled && autoselect && e.target.select()
    }
</script>

{#if titleProp}
    <label for={idProp} class="block h2 font-w-500 full-width text-left">
        { titleProp }
    </label>
    <Br size="10"/>
{/if}

{#if rows || type === 'textarea'}
    <textarea
            {min}
            {max}
            {rows}
            {name}
            {form}
            {align}
            {readonly}
            {disabled}
            {required}
            {minlength}
            {maxlength}
            {placeholder}
            id={idProp}
            class={classProp}
            title={titleProp}
            style={styleProp}
            pattern={patternProp}
            aria-label={ariaLabelProp}
            autocomplete={autocompleteProp}
            {...{ type: typeProp }}
            bind:value
            on:blur='{e => !disabled && dispatch("blur", e)}'
            on:focus='{e => !disabled && dispatch("focus", e)}'
            on:click='{onClick}'
    ></textarea>
{:else}
    <input
            {min}
            {max}
            {name}
            {list}
            {form}
            {align}
            {readonly}
            {disabled}
            {required}
            {minlength}
            {maxlength}
            {placeholder}
            id={idProp}
            class={classProp}
            title={titleProp}
            style={styleProp}
            pattern={patternProp}
            aria-label={ariaLabelProp}
            autocomplete={autocompleteProp}
            {...{ type: typeProp }}
            bind:value
            on:blur='{e => !disabled && dispatch("blur", e)}'
            on:focus='{e => !disabled && dispatch("focus", e)}'
            on:click='{onClick}'
    />
{/if}

<FieldErrors items={errors}/>

<style>
    .inp {
        width: 100%;
        flex: 1 1 0;
        color: inherit;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
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
