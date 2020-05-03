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
    export let align = undefined
    export let minlength = undefined
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
    export let autocomplete = undefined// on|off
    export let ariaLabel = undefined
    export let placeholder = undefined
    export let errors = undefined

    const nameTypes = {
        'sex': { autocomplete: 'sex' },
        'bday': { autocomplete: 'on' },
        'name': { autocomplete: 'name' },
        'fname': { autocomplete: 'name' },
        'lname': { autocomplete: 'name' },
        'email': { autocomplete: 'email' },
        'phone': { autocomplete: 'tel' },
        'new-password': { autocomplete: 'password' },
        'ship-address': { autocomplete: 'shipping street-address' },
        'ship-city': { autocomplete: 'shipping locality' },
        'ship-state': { autocomplete: 'shipping region' },
        'ship-zip': { autocomplete: 'shipping postal-code' },
        'ship-country': { autocomplete: 'shipping country' },
        'ccname': { autocomplete: 'cc-name' },
        'cardnumber': { autocomplete: 'cc-number' },
        'cvc': { autocomplete: 'cc-csc' },
        'cc-exp': { autocomplete: 'cc-exp' },
    }

    $: inputPredict = nameTypes[name] || {}

    $: idProp = id || inputPredict.id || name
    $: typeProp = type === 'number' ? 'text' : type
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern
    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })
    $: autocompleteProp = autocomplete || inputPredict.autocomplete
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
                    bind:value
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
                    {...{ type: typeProp }}
                    bind:value
            />
        {/if}

        <div class="inp-post-icon">
            <slot name="post-icon">
                <Icon type=""/>
            </slot>
        </div>
    </div>

    <FieldErrors items={errors} class="inp-errors">
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
        display: flex;
        align-self: stretch;
        box-shadow: var(--shadow-field-inset);
        border-radius: var(--border-radius-small);
        background-color: rgba(var(--theme-bg-color));
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
    }

    .inp .inp-post-icon {
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
