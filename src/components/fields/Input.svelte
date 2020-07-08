<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import FieldErrors from '@components/FieldErrors.svelte'

    const dispatch = createEventDispatcher()

    export let name
    export let value = ''
    export let style = {}
    export let type = 'text'
    export let id = undefined
    export let min = undefined // Specifies a minimum value for an <input> element
    export let max = undefined // Specifies the maximum value for an <input> element
    export let list = undefined // Refers to a <datalist> element that contains pre-defined options for an <input> element
    export let form = undefined // Specifies the form the <input> element belongs to
    export let maxlength = 1000
    export let disabled = false
    export let rows = undefined
    export let align = undefined
    export let label = undefined
    export let errors = undefined
    export let invalid = undefined
    export let pattern = undefined // Specifies a regular expression that an <input> element's value is checked against (regexp)
    export let readonly = undefined // undefined|readonly
    export let required = undefined // undefined|required
    export let postIcon = undefined
    export let ariaLabel = undefined
    export let minlength = undefined
    export let placeholder = undefined
    export let autocomplete = undefined// on|off

    /**
     * autocomplete - https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
     * names - https://developers.google.com/web/updates/2015/06/checkout-faster-with-autofill
     */
    const nameTypes = {
        'sex': { autocomplete: 'sex' },
        'bday': { autocomplete: 'bday' },
        'name': { autocomplete: 'name' },
        'phone': { autocomplete: 'tel' },
        'fname': { autocomplete: 'name' },
        'lname': { autocomplete: 'name' },
        'email': { autocomplete: 'email' },
        'password': { autocomplete: 'new-password' },
        
        'cvc': { autocomplete: 'cc-csc' },
        'cc-exp': { autocomplete: 'cc-exp' },
        'ccname': { autocomplete: 'cc-name' },
        'cardnumber': { autocomplete: 'cc-number' },

        'ship-state': { autocomplete: 'shipping region' },
        'ship-city': { autocomplete: 'shipping locality' },
        'ship-zip': { autocomplete: 'shipping postal-code' },
        'ship-country': { autocomplete: 'shipping country' },
        'ship-address': { autocomplete: 'shipping street-address' },
    }

    const typePostIcons = {
      date: 'calendar',
      search: 'search',
    }

    $: inputPredict = nameTypes[name] || {}
    $: iconType = postIcon || typePostIcons[type]

    $: error = invalid !== undefined ? invalid : !!(errors || []).length
    $: idProp = id || inputPredict.id || name
    $: typeProp = type
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern
    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, error, postIcon: iconType })
    $: autocompleteProp = autocomplete || inputPredict.autocomplete

    function onInput(e) {
        const value = getValue(e)
        dispatch('input', { e, value, name })
    }

    function onChange(e) {
        const value = getValue(e)
        dispatch('change', { e, value, name })
    }

    function getValue(e) {
        return e.target.value
    }
</script>

<div class={classProp}>
    {#if titleProp}
        <label for={idProp} class="inp-label h2 font-secondary font-w-600 text-left">
            { titleProp }
            <Br size="10"/>
        </label>
    {/if}

    <div class="inp-inner-wrap">
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
                    class="inp-inner"
                    title={titleProp}
                    style={styleProp}
                    pattern={patternProp}
                    aria-label={ariaLabelProp}
                    autocomplete={autocompleteProp}
                    {...{ type: typeProp }}
                    bind:value={value}
                    on:input={onInput}
                    on:change={onChange}
                    on:blur='{e => !disabled && dispatch("blur", e)}'
                    on:focus='{e => !disabled && dispatch("focus", e)}'
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
                    class="inp-inner"
                    title={titleProp}
                    style={styleProp}
                    pattern={patternProp}
                    aria-label={ariaLabelProp}
                    autocomplete={autocompleteProp}
                    {...{ type: typeProp }}
                    bind:value={value}
                    on:input={onInput}
                    on:change={onChange}
                    on:blur='{e => !disabled && dispatch("blur", e)}'
                    on:focus='{e => !disabled && dispatch("focus", e)}'
            >
        {/if}

        <label for={idProp} class="inp-post-icon">
            <slot name="post-icon">
                {#if iconType}
                    <span class="inp-post-icon-inner">
                        <Icon type={iconType} is="info" size="medium"/>
                    </span>
                {/if}
            </slot>
        </label>
    </div>

    <FieldErrors items={errors}>
        <div slot="before">
            <Br size="5"/>
        </div>
    </FieldErrors>
</div>

<style>
    .inp {
        width: 100%;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
    }

    .inp .inp-inner-wrap {
        position: relative;
        display: flex;
        align-self: stretch;
        box-shadow: var(--shadow-field-inset);
        border-radius: var(--border-radius-small);
        background-color: rgba(var(--theme-input-bg-color));
    }

    .inp .inp-inner {
        flex-grow: 1;
        color: inherit;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: transparent;
        -webkit-overflow-scrolling: touch;
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
        border-radius: var(--border-radius-small);
    }

    .inp.disabled {
        opacity: .5;
        pointer-events: none;
    }

    .inp.postIcon .inp-inner {
        padding-right: var(--min-interactive-size);
    }

    .inp .inp-inner:invalid, .inp.error .inp-inner {
        box-shadow: 0 0 0 1px rgb(var(--color-danger));
        color: rgb(var(--color-danger));
    }

    .inp .inp-inner:focus {
        box-shadow: 0 0 0 1px rgb(var(--color-info));
        color: rgb(var(--color-info));
    }


    .inp .inp-inner:invalid + .inp-post-icon :global(.ico),
    .inp.error .inp-post-icon :global(.ico) {
        color: rgb(var(--color-danger)) !important;
    }

    .inp .inp-inner:focus + .inp-post-icon :global(.ico) {
        color: rgb(var(--color-info)) !important;
    }

    .inp .inp-post-icon-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--min-interactive-size);
    }

    .inp .inp-post-icon {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: var(--min-interactive-size);
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .inp .inp-inner::placeholder {
        color: rgba(var(--theme-color-primary-opposite));
        opacity: .2;
    }
</style>
