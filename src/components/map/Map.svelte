<style>
    section {
        flex-grow: 1;
        align-self: stretch;
    }
</style>

<script>
    import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte'
    import { contextMapbox } from './context'

    const dispatch = createEventDispatcher()

    export let center = [31.1656, 48.3794]
    export let zoom = 3.75

    let map
    let container

    setContext(contextMapbox, {
        getMap: () => map,
        getMapbox: () => window.mapboxgl
    })

    function onCreateMap() {
        map = new mapboxgl.Map({
            zoom,
            center,
            container,
            style: 'mapbox://styles/mapbox/streets-v11',
        })

        map.on('dragend', () => dispatch('recentre', { map, center: map.getCenter() }))
        map.on('load', () => dispatch('ready', map))
    }

    function createMap() {
        const scriptTag = document.createElement('script')
        scriptTag.type = 'text/javascript'
        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css'

        scriptTag.onload = () => {
            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'
            mapboxgl.accessToken = token

            link.onload = onCreateMap

            document.head.appendChild(link)
        }

        document.body.appendChild(scriptTag)
    }

    onMount(() => {
        if ('mapboxgl' in window) {
            onCreateMap()
        } else {
            createMap()
        }
    })

    onDestroy(() => {
        map && map.remove()
    })
</script>

<section bind:this={container}>
    {#if map}
        <slot></slot>
    {/if}
</section>
