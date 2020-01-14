<script>
    import { createEventDispatcher, onMount } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let id = undefined
    export let value = 0 // 0 - 100
    export let title = undefined
    export let ariaLabel = undefined

    $: val = 0
    $: titleProp = title || `Progress - ${val}%`
    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`
    $: classProp = classnames('progress', $$props.class)

    onMount(() => {
        // Make loading progress effect on mount component.
        setTimeout(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)
    })
</script>


<div
        {id}
        class={classProp}
        title={titleProp}
        aria-label={ariaLabelProp}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={val}
>
    <div class="progress-inner-frame">
        <div class="progress-core" style={`width:${val}%`}></div>
    </div>
</div>

<style>
    .progress {
        --progress-height: 20px;

        flex: 0;
        width: 100%;
        border-radius: 9999px;
        height: var(--progress-height);
        padding: calc(var(--progress-height) / 4);
        background-color: rgba(var(--theme-bg-color));
        box-shadow: inset var(--shadow-primary), var(--shadow-secondary-inset);
    }

    .progress-inner-frame {
        display: flex;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 9999px;
    }

    .progress-core {
        flex: none;
        align-self: stretch;
        transition: 1s ease-in-out;
        margin-bottom: 2px;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
        background-color: rgba(var(--color-success));
    }
</style>
