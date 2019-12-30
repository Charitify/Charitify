<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let is = ''
    export let type = 'button'
    export let disabled = false

    $: options = {
        type,
        disabled,
        class: classnames(is, $$props.class),
    }
</script>

<button {...options} on:click='{e => !disabled && dispatch("click", e)}'>
    <slot></slot>
</button>

<style>
    button {
        flex: none;
        min-width: 48px;
        max-width: 100%;
        min-height: 48px;
        user-select: none;
        padding: 3px 15px;
        text-align: center;
        border-radius: 4px;
        color: var(--color-light-font);
        text-shadow: 0 0 2px rgba(0,0,0,.1)
    }

    /* Success */

    button.success {
        background-color: rgb(var(--color-success));
        box-shadow: 0 3px rgb(var(--color-success-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.success:focus {
        background-color: rgb(var(--color-success), .85);
    }

    button.success:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-success-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.success:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-success-dark)), 0 10px 15px 0 rgba(0,0,0,0.2);
    }

    /* Warning */

    button.warning {
        background-color: rgb(var(--color-warning));
        box-shadow: 0 3px rgb(var(--color-warning-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.warning:focus {
        background-color: rgb(var(--color-warning), .85);
    }

    button.warning:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-warning-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.warning:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-warning-dark)), 0 10px 15px 0 rgba(0,0,0,0.2);
    }

    /* Danger */

    button.danger {
        background-color: rgb(var(--color-danger));
        box-shadow: 0 3px rgb(var(--color-danger-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.danger:focus {
        background-color: rgb(var(--color-danger), .85);
    }

    button.danger:hover {
        transform: translateY(1px);
        box-shadow: 0 2px rgb(var(--color-danger-dark)), 0 10px 10px 0 rgba(0,0,0,0.2);
    }

    button.danger:active {
        transform: translateY(2px);
        box-shadow: 0 1px rgb(var(--color-danger-dark)), 0 10px 15px 0 rgba(0,0,0,0.2);
    }

</style>
