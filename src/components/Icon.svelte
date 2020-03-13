<script>
    import { classnames, toCSSString } from '../utils'

    export let type
    export let is // primary|warning|danger|light|dark
    export let size = null // small|medium|big
    export let rotate = 0
    export let style = undefined
    export let id = undefined
    export let title = undefined
    export let ariaLabel = undefined

    let titleProp = title || ariaLabel
    let ariaLabelProp = ariaLabel || title
    let styleProp = toCSSString({ transform: !!rotate ? `rotateZ(${rotate}deg)` : null, ...style })

    $: classProp = classnames('ico', is, size, $$props.class)
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
        flex-grow: 1;
        align-self: stretch;
    }

    svg, svg * {
        fill: rgba(var(--theme-svg-fill));
        stroke: rgba(var(--theme-svg-fill));
    }

    /* ------------=========( Size )=========------------ */
    .small {
        width: 18px;
        height: 18px;
        flex: none;
        align-self: auto;
    }

    .medium {
        width: 24px;
        height: 24px;
        flex: none;
        align-self: auto;
    }

    .big {
        width: 30px;
        height: 30px;
        flex: none;
        align-self: auto;
    }

    /* ------------=========( Color )=========------------ */
    .primary, .primary * {
        fill: rgb(var(--color-success));
        stroke: rgb(var(--color-success));
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
        fill: rgb(var(--color-white));
        stroke: rgb(var(--color-white));
    }

    .dark, .dark * {
        fill: rgb(var(--color-black));
        stroke: rgb(var(--color-black));
    }
</style>
