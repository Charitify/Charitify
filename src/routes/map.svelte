<svelte:head>
    <title>Charitify - Map of organizations.</title>
</svelte:head>

<style>
    section {
        flex-grow: 1;
    }
</style>

<script>
    import { onMount, onDestroy } from 'svelte'

    let map
    let container
    let scriptTag
    let link

    // See example: https://github.com/ccd-adc-dev/sapper-mapbox/tree/master/src/components/map

    onMount(async () => {
        // const { default: mapboxgl } = await import('mapbox-gl')

        scriptTag = document.createElement('script')
        scriptTag.type = 'text/javascript'
        scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js'

        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css';

        scriptTag.onload = () => {
            const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'

            mapboxgl.accessToken = token

            link.onload = () => {
                map = new mapboxgl.Map({
                    container,
                    style: 'mapbox://styles/mapbox/streets-v11',
                })

                for (let i = 0; i < 100; i += 1) {
                    const lng = Math.random() * 360 - 180
                    const lat = Math.random() * 180 - 90

                    new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .addTo(map)
                }
            }

            document.head.appendChild(link);
        }

        document.body.appendChild(scriptTag);
    })

    onDestroy(() => {
        map.remove();
        link.parentNode.removeChild(link);
        scriptTag.parentNode.removeChild(scriptTag);
    })
</script>

<section bind:this={container}>
    {#if map}
        <slot></slot>
    {/if}
</section>
