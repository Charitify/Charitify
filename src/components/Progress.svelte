<script>
    import { createEventDispatcher, onMount } from 'svelte'
    import { classnames, safeGet } from '@utils'

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
        requestAnimationFrame(() => val = Number.isFinite(+value) ? Math.max(0, Math.min(+value, 100)) : 0, 0)
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
        style={getBorderRadius(borderRadius)}
>
    <div class="progress-inner-frame">
        <div class="progress-core" style={`width:${val}%`}></div>
    </div>
</div>

<style>
    .progress.medium {
        --progress-height: 10px;
        --progress-padding-point: 1px;
    }

    .progress {
        flex: 0;
        width: 100%;
        border-radius: 9999px;
        height: var(--progress-height);
    }

    .progress-inner-frame {
        position: relative;
        display: flex;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        overflow: hidden;
        padding: var(--progress-padding-point) 0;
        background-color: rgba(var(--theme-color-primary-opposite), .1);
        background-clip: content-box;
    }

    .progress-core {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        flex: none;
        align-self: stretch;
        transition: 1s ease-in-out;
        border-radius: 9999px;
        background-color: rgba(var(--color-info));
    }

    .progress[aria-valuenow="100"] .progress-core {
        background-color: rgba(var(--color-success));
    }
</style>
