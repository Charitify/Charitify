<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let is = undefined
    export let id = undefined
    export let href = undefined
    export let auto = false
    export let type = 'button'
    export let size = undefined
    export let title = undefined
    export let htmlFor = undefined
    export let disabled = false
    export let ariaLabel = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title

    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })

    function onLabelClick(e) {
        document.getElementById(htmlFor).click()
        !disabled && dispatch('click', e)
    }

    function onClick(e) {
        !disabled && dispatch('click', e)
    }
</script>

{#if href}
    <a
            {id}
            {href}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onClick}
    >
        <slot></slot>
    </a>
{:else if htmlFor}
    <label
            {id}
            {disabled}
            for={htmlFor}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onLabelClick}
    >
        <slot></slot>
    </label>
{:else}
    <button
            {id}
            {type}
            {disabled}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onClick}
    >
        <slot></slot>
    </button>
{/if}

<style>
    .btn:not(.auto) {
        width: 100%;
        padding: 5px 15px;
    }

    :global(.btn) {
        flex: none;
        cursor: pointer;
        max-width: 100%;
        user-select: none;
        font-weight: bold;
        text-align: center;
        align-items: center;
        display: inline-flex;
        justify-content: center;
        color: rgba(var(--theme-font-color));
        border-radius: var(--border-radius-medium);
    }

    :global(.btn.small) {
        padding: 5px;
        min-width: calc(var(--min-interactive-size) / 1.3);
        min-height: calc(var(--min-interactive-size) / 1.3);
    }

    :global(.btn.medium) {
        padding: 5px 10px;
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
    }

    :global(.btn.big) {
        padding: 5px 15px;
        min-width: calc(var(--min-interactive-size) * 1.3);
        min-height: calc(var(--min-interactive-size) * 1.3);
    }

    :global(.btn:focus) {
        background-color: rgba(var(--color-black), 0.1);
    }

    :global(.btn:hover) {
        background-color: rgba(var(--color-black), 0.1);
    }

    :global(.btn:active) {
        background-color: rgba(var(--color-black), 0.1);
    }

    /* White */

    :global(.btn).white {
        color: rgba(var(--color-font-dark));
        background-color: rgba(var(--color-white));
    }

    :global(.btn).white:focus {
        background-color: rgba(var(--color-white), .85);
    }

    :global(.btn).white:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).white:active {
        box-shadow: var(--shadow-primary);
    }

    /* Success */

    :global(.btn).success {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-success));
    }

    :global(.btn).success:focus {
        background-color: rgba(var(--color-success), .85);
    }

    :global(.btn).success:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).success:active {
        box-shadow: var(--shadow-primary);
    }

    /* Warning */

    :global(.btn).warning {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-warning));
    }

    :global(.btn).warning:focus {
        background-color: rgba(var(--color-warning), .85);
    }

    :global(.btn).warning:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).warning:active {
        box-shadow: var(--shadow-primary);
    }

    /* Danger */

    :global(.btn).danger {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-danger));
    }

    :global(.btn).danger:focus {
        background-color: rgba(var(--color-danger), .85);
    }

    :global(.btn).danger:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).danger:active {
        box-shadow: var(--shadow-primary);
    }
</style>
