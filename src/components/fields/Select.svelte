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
    export let autocomplete = 'on'
    export let postIcon = undefined
    export let errors = undefined
    /**
     *
     * @type {{
     *     value: string,
     *     label: string,
     * }[]}
     */
    export let options = []

    $: iconType = postIcon || 'caret-down'
    $: error = invalid || !!(errors || []).length
    $: idProp = id || name
    $: titleProp = label || ariaLabel
    $: ariaLabelProp = ariaLabel || label || placeholder
    $: styleProp = toCSSString({ ...style, textAlign: align })
    $: classProp = classnames('select', $$props.class, { disabled, readonly, required, error })

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
        <label for={idProp} class="block h2 font-w-500 full-width text-left">
            { titleProp }
        </label>
        <Br size="10"/>
    {/if}

    <div class="inp-inner-wrap">
        <select
                {name}
                {type}
                {form}
                {align}
                {readonly}
                {disabled}
                {required}
                {placeholder}
                {autocomplete}
                id={idProp}
                class="inp-inner"
                title={titleProp}
                style={styleProp}
                aria-label={ariaLabelProp}
                bind:value
                on:change={onChange}
                on:blur='{e => !disabled && dispatch("blur", e)}'
                on:focus='{e => !disabled && dispatch("focus", e)}'
        >
            {#each options as { label: text, ...option }}
                {#if option.value !== undefined && text !== undefined}
                    <option value={option.value}>
                        {text}
                    </option>
                {/if}
            {/each}
        </select>

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

    <FieldErrors items={errors}/>
</div>

<style>
    .select {
        width: 100%;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
    }

    .select .inp-inner-wrap {
        position: relative;
        display: flex;
        align-self: stretch;
        box-shadow: var(--shadow-field-inset);
        border-radius: var(--border-radius-small);
        background-color: rgba(var(--theme-bg-color));
    }

    .select .inp-inner {
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

    .select .inp-post-icon {
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

    .select .inp-post-icon-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--min-interactive-size);
    }

    .select .inp-inner option[default],
    .select .inp-inner::placeholder {
        color: rgba(var(--theme-color-primary-opposite));
        opacity: .2;
    }

    .select.postIcon .inp-inner {
        padding-right: var(--min-interactive-size);
    }

    .select .inp-inner:invalid,
    .select.error .inp-inner {
        box-shadow: 0 0 0 1px rgb(var(--color-danger));
        color: rgb(var(--color-danger));
    }

    .select .inp-inner:invalid + .inp-post-icon :global(.ico),
    .select.error .inp-post-icon :global(.ico) {
        color: rgb(var(--color-danger)) !important;
    }

    .select .inp-inner:focus {
        box-shadow: 0 0 0 1px rgb(var(--color-info));
        color: rgb(var(--color-info));
    }

    .select .inp-inner:focus + .inp-post-icon :global(.ico) {
        color: rgb(var(--color-info)) !important;
    }

</style>
