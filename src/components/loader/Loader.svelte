<script>
    // How to make a custom loader?
    // See here for generating: https://danilowoz.com/create-content-loader/
    
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import Text from './Text.svelte'

    export let width = '100%' 
    export let height = '100%'
    export let light = '#999999';
    export let dark = '#555555';
    export let opacity = .2;
    export let border = false;
    export let type = 'p'; // h1, h2, h3, h4, h5, h6, p, pre

    let hTypes = {
        p: 23,
        h1: 37,
        h2: 29,
        h3: 23,
        h4: 23,
        h5: 23,
        h6: 23,
        pre: 20,
    }

    onMount(() => {
        const style = getComputedStyle(document.body);
        console.log(style.getPropertyValue('font-size'));
        console.log(style.getPropertyValue('line-height'));
    })

    $: areaWidth = width.replace('%', '')
    $: areaHeight = hTypes[type] || height.replace('%', '')
    $: classProp = classnames('loader', { border })
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
            clip-path="url(#clip-path)"
            style='fill: url("#fill");'
        ></rect>
        <defs>
            <clipPath id="clip-path">
                <slot>
                    {#if type}
                        <Text/>
                    {/if}
                </slot>
            </clipPath>
            <linearGradient id="fill">
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

    .loader.border {
        outline-width: 1px;
        outline-style: solid;
    }
</style>
