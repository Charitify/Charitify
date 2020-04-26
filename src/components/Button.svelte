<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'

    const dispatch = createEventDispatcher()

    export let is = undefined // theme, theme-border, white, success, warning, danger, dark, dark-border
    export let id = undefined
    export let rel = undefined
    export let href = undefined
    export let auto = false
    export let type = 'button'
    export let form = undefined
    export let size = undefined
    export let title = undefined
    export let style = undefined
    export let htmlFor = undefined
    export let disabled = false
    export let ariaLabel = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title
    let audio

    $: classProp = classnames('btn', is, size, $$props.class, { auto, disabled })

    function onLabelClick(e) {
        document.getElementById(htmlFor).click()
        !disabled && dispatch('click', e)
    }

    function onClick(e) {
        e.stopPropagation();
        !disabled && dispatch('click', e)
    }

    function onTouchStart() {
        audio.playbackRate = 2
        audio.play()
    }

    function onTouchEnd() {}
</script>

{#if href}
    <a
            {id}
            {rel}
            {href}
            {style}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onClick}
            on:touchstart={onTouchStart}
            on:touchend={onTouchEnd}
    >
        <slot></slot>
    </a>
{:else if htmlFor}
    <label
            {id}
            {style}
            {disabled}
            for={htmlFor}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onLabelClick}
            on:touchstart={onTouchStart}
            on:touchend={onTouchEnd}
    >
        <slot></slot>
    </label>
{:else}
    <button
            {id}
            {form}
            {type}
            {style}
            {disabled}
            title={titleProp}
            class={classProp}
            aria-label={ariaLabelProp}
            on:click={onClick}
            on:touchstart={onTouchStart}
            on:touchend={onTouchEnd}
    >
        <slot></slot>
    </button>
{/if}

<audio bind:this={audio} src="./button_click.mp3"></audio>

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

    /* theme */

    :global(.btn).theme {
        color: rgba(var(--theme-font-color));
        background-color: rgba(var(--theme-color-secondary));
    }

    :global(.btn).theme:focus {
        background-color: rgba(var(--theme-color-secondary), .85);
    }

    :global(.btn).theme:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).theme:active {
        box-shadow: var(--shadow-primary);
    }

    /* theme */

    :global(.btn).theme-border {
        color: rgba(var(--theme-font-color));
        border: 2px solid rgba(var(--theme-color-primary-opposite));
    }

    :global(.btn).theme-border:focus {
        background-color: rgba(var(--theme-color-secondary), .85);
    }

    :global(.btn).them-border:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).theme-border:active {
        box-shadow: var(--shadow-primary);
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

    /* Dark */

    :global(.btn).dark {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-dark));
    }

    :global(.btn).dark:focus {
        background-color: rgba(var(--color-dark), .85);
    }

    :global(.btn).dark:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).dark:active {
        box-shadow: var(--shadow-primary);
    }

    /* Dark-border */

    :global(.btn).dark-border {
        color: rgba(var(--color-font-dark));
        border: 2px solid rgba(var(--color-dark));
    }

    :global(.btn).dark-border:focus {
        background-color: rgba(var(--color-dark), .85);
    }

    :global(.btn).dark-border:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).dark-border:active {
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

    /* Info */

    :global(.btn).info {
        color: rgba(var(--color-font-light));
        background-color: rgba(var(--color-info));
    }

    :global(.btn).info:focus {
        background-color: rgba(var(--color-info), .85);
    }

    :global(.btn).info:hover {
        box-shadow: var(--shadow-primary);
    }

    :global(.btn).info:active {
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
