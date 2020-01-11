<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '../utils'

    const dispatch = createEventDispatcher()

    export let name
    export let value = ''
    export let style = {}
    export let type = 'text'
    export let id = undefined
    export let align = undefined
    export let maxlength = 1000
    export let rows = undefined
    export let disabled = false
    export let title = undefined
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

    let idProp = id || name
    let typeProp = type === 'number' ? 'text' : type
    let titleProp = title || ariaLabel || placeholder
    let ariaLabelProp = ariaLabel || title || placeholder
    let autocompleteProp = autocomplete ? 'on' : 'off'
    let styleProp = toCSSString({ ...style, textAlign: align })
    let patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern

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

{#if rows}
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

<style>
    .inp {
        width: 100%;
        flex: 1 1 0;
        color: inherit;
        border-radius: var(--border-radius);
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
        border: 1px solid rgba(var(--color-black), .2);
        background-color: rgba(var(--theme-bg-color));
        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);
    }

    .inp:focus {
        border-color: rgb(var(--color-success));
    }

    .inp:invalid, .inp.invalid {
        border-color: rgb(var(--color-danger));
    }
</style>
