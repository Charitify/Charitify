<script>
    import { classnames, toCSSString } from '../utils'

    export let type
    export let is = 'primary'
    export let size = 'medium'
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

    .primary * {
        fill: rgb(var(--color-success));
        stroke: rgb(var(--color-success));

    }
    .warning *{
        fill: rgb(var(--color-warning));
        stroke: rgb(var(--color-warning));
    }
    .danger * {
        fill: rgb(var(--color-danger));
        stroke: rgb(var(--color-danger));
    }
</style>
