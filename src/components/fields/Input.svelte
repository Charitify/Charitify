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
    export let autocomplete = undefined// on|off
    export let autoselect = false
    export let ariaLabel = undefined
    export let placeholder = undefined
    export let autocorrect = 'on'
    export let errors = undefined

    const nameTypes = {
        'sex': { autocomplete: 'sex', id: 'frmSexA' },
        'bday': { autocomplete: 'on', id: 'frmBirthA' },
        'name': { autocomplete: 'name', id: 'frmNameA' },
        'email': { autocomplete: 'email', id: 'frmEmailA' },
        'phone': { autocomplete: 'tel', id: 'frmPhoneNumA' },
        'new-password': { autocomplete: 'password', id: 'userPassword' },
        'ship-address': { autocomplete: 'shipping street-address', id: 'frmAddressS' },
        'ship-city': { autocomplete: 'shipping locality', id: 'frmCityS' },
        'ship-state': { autocomplete: 'shipping region', id: 'frmStateS' },
        'ship-zip': { autocomplete: 'shipping postal-code', id: 'frmZipS' },
        'ship-country': { autocomplete: 'shipping country', id: 'frmCountryS' },
        'ccname': { autocomplete: 'cc-name', id: 'frmNameCC' },
        'cardnumber': { autocomplete: 'cc-number', id: 'frmCCNum' },
        'cvc': { autocomplete: 'cc-csc', id: 'frmCCCVC' },
        'cc-exp': { autocomplete: 'cc-exp', id: 'frmCCExp' },
    }

    $: inputPredict = nameTypes[name] || {}

    $: idProp = id || inputPredict.id || name
    $: typeProp = type === 'number' ? 'text' : type
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: patternProp = type === 'number' && !pattern ? '[0-9]*' : pattern
    $: classProp = classnames('inp', $$props.class, { disabled, readonly, required, invalid })
    $: autocompleteProp = autocomplete || inputPredict.autocomplete || 'on'

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

<fieldset class={classProp}>
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
                    {autocorrect}
                    id={idProp}
                    class="inp-inner"
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
                    {autocorrect}
                    id={idProp}
                    class="inp-inner"
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
</fieldset>

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
