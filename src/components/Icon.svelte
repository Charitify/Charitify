<script>
    /**
     * @info see more icons: https://www.svelte-icons.gibdig.com/
     */
    import { classnames, toCSSString } from '@utils'
    import { icons } from '@config'


    export let type
    export let is = null // primary|warning|danger|light|dark
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

<i {id} title={titleProp} style={styleProp} class={classProp}>
    <svelte:component this={icons[type]}/>
</i>

<style>
    .ico {
        flex-grow: 1;
        align-self: stretch;
        display: inline-flex;
        vertical-align: middle;
    }

    .ico:not(.custom) * {
        color: rgba(var(--theme-svg-fill));
    }

    /* ------------=========( Size )=========------------ */
    .tiny {
        width: 13px;
        height: 13px;
        flex: none;
        align-self: auto;
    }

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

    .large {
        width: 40px;
        height: 40px;
        flex: none;
        align-self: auto;
    }

    /* ------------=========( Color )=========------------ */
    .ico.primary {
        color: rgb(var(--color-success));
    }

    .ico.danger {
        color: rgb(var(--color-danger));
    }

    .ico.info {
        color: rgb(var(--color-info));
    }

    .ico.light {
        color: rgb(var(--color-white));
    }

    .ico.dark {
        color: rgb(var(--color-black));
    }
</style>
