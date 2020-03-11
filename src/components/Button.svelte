<script>
    import { createEventDispatcher, onMount } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let is = undefined
    export let id = undefined
    export let href = undefined
    export let auto = false
    export let type = 'button'
    export let size = 'medium'
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
    }

    :global(.btn) {
        flex: none;
        cursor: pointer;
        max-width: 100%;
        user-select: none;
        padding: 5px 15px;
        margin-bottom: 3px;
        font-weight: bold;
        text-align: center;
        align-items: center;
        display: inline-flex;
        justify-content: center;
        border-radius: var(--border-radius);
        color: rgba(var(--theme-font-color));
        text-shadow: 1px 1px rgba(var(--color-black), .3);
    }

    :global(.btn.small) {
        padding: 5px;
        min-width: calc(var(--min-interactive-size) / 1.5);
        min-height: calc(var(--min-interactive-size) / 1.5);
    }

    :global(.btn.medium) {
        padding: 5px 10px;
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
    }

    :global(.btn.big) {
        padding: 5px 15px;
        min-width: calc(var(--min-interactive-size) * 1.5);
        min-height: calc(var(--min-interactive-size) * 1.5);
    }

    :global(.btn:focus) {
        background-color: rgba(var(--color-black), 0.1);
    }

    :global(.btn:hover) {
        box-shadow: 0 2px rgba(var(--color-black), 0.2);
        background-color: rgba(var(--color-black), 0.1);
    }

    :global(.btn:active) {
        transform: translateY(1px);
        box-shadow: 0 1px rgba(var(--color-black), 0.2);
        background-color: rgba(var(--color-black), 0.1);
    }

    /* Success */

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
        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);
    }

    :global(.btn).success:focus {
        background-color: rgba(var(--color-success), .85);
    }

    :global(.btn).success:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);
    }

    :global(.btn).success:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgba(var(--color-success-dark)), var(--shadow-secondary);
    }

    /* Danger */

    :global(.btn).danger {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-danger));
        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);
    }

    :global(.btn).danger:focus {
        background-color: rgba(var(--color-danger), .85);
    }

    :global(.btn).danger:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);
    }

    :global(.btn).danger:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgba(var(--color-danger-dark)), var(--shadow-secondary);
    }


    @media screen and (min-width: 769px) {
        :global(.btn) {
            margin-bottom: 2px;
        }

        :global(.btn).success {
            box-shadow: 0 3px rgba(var(--color-success-dark)), var(--shadow-secondary), var(--shadow-primary);
        }

        :global(.btn).warning {
            box-shadow: 0 3px rgba(var(--color-warning-dark)), var(--shadow-secondary), var(--shadow-primary);
        }

        :global(.btn).danger {
            box-shadow: 0 3px rgba(var(--color-danger-dark)), var(--shadow-secondary), var(--shadow-primary);
        }
    }
</style>
