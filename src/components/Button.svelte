<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let is = undefined
    export let id = undefined
    export let href = undefined
    export let auto = false
    export let type = 'button'
    export let size = 'medium'
    export let title = undefined
    export let disabled = false
    export let ariaLabel = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title

    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })
</script>

{#if href}
    <a
            {id}
            {href}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click='{e => !disabled && dispatch("click", e)}'
    >
        <slot></slot>
    </a>
{:else}
    <button
            {id}
            {type}
            {disabled}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click='{e => !disabled && dispatch("click", e)}'
    >
        <slot></slot>
    </button>
{/if}

<style>
    .btn:not(.auto) {
        width: 100%;
    }

    .btn {
        flex: none;
        color: inherit;
        max-width: 100%;
        user-select: none;
        padding: 5px 15px;
        font-weight: bold;
        text-align: center;
        align-items: center;
        display: inline-flex;
        justify-content: center;
        border-radius: var(--border-radius);
        text-shadow: 1px 1px rgba(0, 0, 0, .3);
    }

    .small {
        padding: 5px;
        min-width: calc(var(--min-interactive-size) / 1.5);
        min-height: calc(var(--min-interactive-size) / 1.5);
    }

    .medium {
        padding: 5px 10px;
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
    }

    .big {
        padding: 5px 15px;
        min-width: calc(var(--min-interactive-size) * 1.5);
        min-height: calc(var(--min-interactive-size) * 1.5);
    }

    .btn:focus {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .btn:hover {
        box-shadow: 0 2px rgba(0, 0, 0, 0.2);
        background-color: rgba(0, 0, 0, 0.1);
    }

    .btn:active {
        transform: translateY(1px);
        box-shadow: 0 1px rgba(0, 0, 0, 0.2);
        background-color: rgba(0, 0, 0, 0.1);
    }

    /* Success */

    .btn.success {
        color: var(--color-light-font);
        background-color: rgb(var(--color-success));
        box-shadow: 0 2px rgb(var(--color-success-dark)), var(--secondary-shadow);
    }

    .btn.success:focus {
        background-color: rgb(var(--color-success), .85);
    }

    .btn.success:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-success-dark)), var(--secondary-shadow);
    }

    .btn.success:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-success-dark)), var(--secondary-shadow);
    }

    /* Warning */

    .btn.warning {
        color: var(--color-light-font);
        background-color: rgb(var(--color-warning));
        box-shadow: 0 2px rgb(var(--color-warning-dark)), var(--secondary-shadow);
    }

    .btn.warning:focus {
        background-color: rgb(var(--color-warning), .85);
    }

    .btn.warning:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-warning-dark)), var(--secondary-shadow);
    }

    .btn.warning:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-warning-dark)), var(--secondary-shadow);
    }

    /* Danger */

    .btn.danger {
        color: var(--color-light-font);
        background-color: rgb(var(--color-danger));
        box-shadow: 0 2px rgb(var(--color-danger-dark)), var(--secondary-shadow);
    }

    .btn.danger:focus {
        background-color: rgb(var(--color-danger), .85);
    }

    .btn.danger:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-danger-dark)), var(--secondary-shadow);
    }

    .btn.danger:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-danger-dark)), var(--secondary-shadow);
    }


    @media screen and (min-width: 769px) {
        .btn.success {
            box-shadow: 0 3px rgb(var(--color-success-dark)), var(--secondary-shadow);
        }

        .btn.warning {
            box-shadow: 0 3px rgb(var(--color-warning-dark)), var(--secondary-shadow);
        }

        .btn.danger {
            box-shadow: 0 3px rgb(var(--color-danger-dark)), var(--secondary-shadow);
        }
    }
</style>
