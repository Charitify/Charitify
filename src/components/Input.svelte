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
    export let autocomplete = 'on' // on|off
    export let readonly = undefined // undefined|readonly
    export let required = undefined // undefined|required
    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)
    export let autofocus = false
    export let autoselect = false
    export let ariaLabel = undefined
    export let placeholder = undefined

    $: options = {
        id,
        min,
        max,
        rows,
        name,
        list,
        form,
        align,
        title,
        pattern,
        readonly,
        disabled,
        required,
        maxlength,
        placeholder,
        autocomplete,
        'aria-label': ariaLabel || placeholder,
        style: toCSSString({ ...style, textAlign: align }),
        autofocus: autofocus ? 'autofocus' : undefined,
        class: classnames('inp', 'theme-bg-color', $$props.class, { disabled, readonly, required, invalid }),
        ...getType(type),
    }

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

    /**
     *
     * @description Get certain rules for not standard cases of input view. (Mobile/desktop)
     *
     * @param {string} type - Native type of input (number|text|url\tel\email)
     * @return {*|{type: *}}
     */
    function getType(type) {
        return ({
          'number': {
              type: 'text',
              pattern: `[0-9]*`,
          }
        })[type] || { type }
    }
</script>

{#if rows}
    <textarea
            {...options}
            bind:value
            on:blur='{e => !disabled && dispatch("blur", e)}'
            on:focus='{e => !disabled && dispatch("focus", e)}'
            on:click='{onClick}'
    ></textarea>
{:else}
    <input
            {...options}
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
        border: 2px solid rgb(var(--color-info));
    }

    .inp:focus {
        border-color: rgb(var(--color-success));
    }

    .inp:invalid, .inp.invalid {
        border-color: rgb(var(--color-danger));
    }
</style>
