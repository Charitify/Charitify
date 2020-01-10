<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let is = undefined
    export let id = undefined
    export let href = undefined
    export let type = 'button'
    export let title = undefined
    export let disabled = false
    export let ariaLabel = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title

    $: classProp = classnames('btn', is, $$props.class, { disabled })
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
    .btn {
        flex: none;
        width: 100%;
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
        min-width: var(--min-interactive-size);
        min-height: var(--min-interactive-size);
        text-shadow: 1px 1px rgba(0, 0, 0, .3);
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
        box-shadow: 0 3px rgb(var(--color-success-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.success:focus {
        background-color: rgb(var(--color-success), .85);
    }

    .btn.success:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-success-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.success:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-success-dark)), 0 10px 15px 0 rgba(0, 0, 0, 0.2);
    }

    /* Warning */

    .btn.warning {
        color: var(--color-light-font);
        background-color: rgb(var(--color-warning));
        box-shadow: 0 3px rgb(var(--color-warning-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.warning:focus {
        background-color: rgb(var(--color-warning), .85);
    }

    .btn.warning:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-warning-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.warning:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-warning-dark)), 0 10px 15px 0 rgba(0, 0, 0, 0.2);
    }

    /* Danger */

    .btn.danger {
        color: var(--color-light-font);
        background-color: rgb(var(--color-danger));
        box-shadow: 0 3px rgb(var(--color-danger-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.danger:focus {
        background-color: rgb(var(--color-danger), .85);
    }

    .btn.danger:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-danger-dark)), 0 10px 10px 0 rgba(0, 0, 0, 0.2);
    }

    .btn.danger:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-danger-dark)), 0 10px 15px 0 rgba(0, 0, 0, 0.2);
    }
</style>
