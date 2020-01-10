<script>
    import { classnames, toCSSString } from '../utils'

    export let type
    export let is = 'primary' // primary|warning|danger
    export let size = 'medium' // small|medium|big
    export let rotate = 0
    export let style = undefined
    export let id = undefined
    export let title = undefined
    export let ariaLabel = undefined

    $: options = {
        id,
        title,
        'aria-label': ariaLabel,
        class: classnames('ico', is, size, $$props.class),
        style: toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style }),
    }
</script>

<svg {...options}>
    <use xlink:href={`#ico-${type}`} class="ico_use"/>
</svg>

<style>
    svg {
        display: inherit;
    }

    /* ------------=========( Size )=========------------ */
    .small {
        width: 15px;
        height: 15px;
    }

    .medium {
        width: 25px;
        height: 25px;
    }

    .big {
        width: 35px;
        height: 35px;
    }

    /* ------------=========( Color )=========------------ */
    .primary * {
        fill: rgb(var(--color-success));
        stroke: rgb(var(--color-success));
    }

    .warning * {
        fill: rgb(var(--color-warning));
        stroke: rgb(var(--color-warning));
    }

    .danger * {
        fill: rgb(var(--color-danger));
        stroke: rgb(var(--color-danger));
    }
</style>
