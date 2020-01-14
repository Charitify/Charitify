<script>
    import { createEventDispatcher, onMount } from 'svelte'
    import { classnames, safeGet } from '../utils'

    const dispatch = createEventDispatcher()

    export let id = undefined
    export let value = 0 // 0 - 100
    export let size = 'medium'
    export let title = undefined
    export let ariaLabel = undefined
    export let borderRadius = undefined

    $: val = 0
    $: titleProp = title || `Progress - ${val}%`
    $: ariaLabelProp = ariaLabel || `Progress - ${val}%`
    $: classProp = classnames('progress', size, $$props.class)

    onMount(() => {
        // Make loading progress effect on mount component.
        setTimeout(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)
    })

    function getBorderRadius(borders, defaults = '99999px') {
        const brDefault = new Array(4).fill(defaults)
        const bds = safeGet(() => borders.split(' '), [], true)
        const rule = 'border-radius'
        return `${rule}:${brDefault.map((def, i) => `${bds[i] || def}`).join(' ')}`
    }
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
        style={`${getBorderRadius(borderRadius)}`}
>
    <div class="progress-inner-frame">
        <div class="progress-core" style={`width:${val}%`}></div>
    </div>
</div>

<style>
    .progress {
        --progress-height: 20px;
        --progress-padding-point: 3;
    }

    .progress.small {
        --progress-height: 15px;
        --progress-padding-point: 3;
    }

    .progress.medium {
        --progress-height: 20px;
        --progress-padding-point: 3.5;
    }

    .progress.big {
        --progress-height: 30px;
        --progress-padding-point: 4;
    }

    .progress {
        flex: 0;
        width: 100%;
        border-radius: 9999px;
        height: var(--progress-height);
        background-color: rgba(var(--theme-bg-color));
        padding: calc(var(--progress-height) / var(--progress-padding-point));
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
