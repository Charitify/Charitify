<script>
    import { classnames, toCSSString } from '../utils'

    export let type
    export let is // primary|warning|danger|light|dark
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
    <use xlink:href={`#ico-${type}`} class="ico-use"/>
</svg>

<style>
    svg {
        display: inherit;
    }

    svg, svg * {
        fill: rgba(var(--theme-svg-fill));
        stroke: rgba(var(--theme-svg-fill));
    }

    /* ------------=========( Size )=========------------ */
    .small {
        width: 15px;
        height: 15px;
    }

    .medium {
        width: 22px;
        height: 22px;
    }

    .big {
        width: 35px;
        height: 35px;
    }

    /* ------------=========( Color )=========------------ */
    .primary, .primary * {
        fill: rgb(var(--color-success));
        stroke: rgb(var(--color-success));
    }

    .warning, .warning * {
        fill: rgb(var(--color-warning));
        stroke: rgb(var(--color-warning));
    }

    .danger, .danger * {
        fill: rgb(var(--color-danger));
        stroke: rgb(var(--color-danger));
    }

    .info, .info * {
        fill: rgb(var(--color-info));
        stroke: rgb(var(--color-info));
    }

    .light, .light * {
        fill: var(--color-light-1);
        stroke: var(--color-light-1);
    }

    .dark, .dark * {
        fill: var(--color-dark-1);
        stroke: var(--color-dark-1);
    }
</style>
