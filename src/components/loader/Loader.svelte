<script>
    // How to make a custom loader?
    // See here for generating: https://danilowoz.com/create-content-loader/
    
    import { onMount } from 'svelte'
    import { classnames, uuid } from '@utils'
    import Text from './Text.svelte'
    import Circle from './Circle.svelte'

    export let width = '100%' 
    export let height = '100%'
    export let light = '#999999';
    export let dark = '#555555';
    export let opacity = .2;
    export let border = false;
    export let absolute = false;
    export let type; // h1, h2, h3, h4, h5, h6, p, pre, avatar

    const uid = uuid()

    let hTypes = {
        p: 21,
        h1: 35,
        h2: 29,
        h3: 26,
        h4: 21,
        h5: 21,
        h6: 21,
        pre: 21,
    }

    onMount(() => {
        const style = getComputedStyle(document.body);
        const lh = Number.parseInt(style.getPropertyValue('line-height'))
        const balance = 0

        hTypes = {
            p: lh * 1.15 + balance,
            h1: lh * 1.85 + balance,
            h2: lh * 1.4 + balance,
            h3: lh * 1.3 + balance,
            h4: lh * 1.15 + balance,
            h5: lh * 1.15 + balance,
            h6: lh * 1.15 + balance,
            pre: lh * 1.15 + balance,
        }
    })

    $: areaWidth = width.replace('%', '')
    $: areaHeight = hTypes[type] || height
    $: classProp = classnames('loader', { border, absolute })
</script>

<section 
    class={classProp}
    style={`opacity: ${opacity}; outline-color: ${light};`}
>
    <svg
        role="img"
        width="100%"
        height={areaHeight}
        aria-labelledby="loading-aria"
        viewBox={`0 0 ${areaWidth} 100`}
        preserveAspectRatio="none"
    >
        <title id="loading-aria">Loading...</title>
        <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            clip-path={`url(#clip-path-${uid})`}
            style='fill: url("#loader-fill");'
        ></rect>
        <defs>
            <clipPath id={`clip-path-${uid}`}>
                <slot>
                    {#if 'avatar'.includes(type)}
                        <Circle/>
                    {:else if 'h1,h2,h3,h4,h5,h6,p,pre'.includes(type)}
                        <Text/>
                    {/if}
                </slot>
            </clipPath>
            <linearGradient id="loader-fill">
                <stop
                    offset="0.599964"
                    stop-color={light}
                    stop-opacity="1"
                >
                    <animate
                    attributeName="offset"
                    values="-2; -2; 1"
                    keyTimes="0; 0.25; 1"
                    dur="2s"
                    repeatCount="indefinite"
                    ></animate>
                </stop>
                <stop
                    offset="1.59996"
                    stop-color={dark}
                    stop-opacity="1"
                >
                    <animate
                    attributeName="offset"
                    values="-1; -1; 2"
                    keyTimes="0; 0.25; 1"
                    dur="2s"
                    repeatCount="indefinite"
                    ></animate>
                </stop>
                <stop
                    offset="2.59996"
                    stop-color={light}
                    stop-opacity="1"
                >
                    <animate
                    attributeName="offset"
                    values="0; 0; 3"
                    keyTimes="0; 0.25; 1"
                    dur="2s"
                    repeatCount="indefinite"
                    ></animate>
                </stop>
            </linearGradient>
        </defs>
    </svg>
</section>

<style>
    .loader {
        display: flex;
        flex: 1 1 auto;
        align-self: stretch;
    }

    .loader svg {
        flex: 1 1 auto;
        align-self: stretch;
    }

    .loader.absolute {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .loader.border {
        outline-width: 1px;
        outline-style: solid;
    }
</style>
