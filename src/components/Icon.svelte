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

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title
    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })

    $:  classProp = classnames('ico', is, size, $$props.class)
</script>

<svg
        {id}
        title={titleProp}
        class={classProp}
        style={styleProp}
        aria-label={ariaLabelProp}
>
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
        width: 20px;
        height: 20px;
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
