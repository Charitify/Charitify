<svelte:head>
    <title>Charitify - Map of organizations.</title>
</svelte:head>

<style>
    section {
        flex-grow: 1;
    }
</style>

<script>
    import { onMount } from 'svelte'

    onMount(async () => {
        const { default: mapboxgl } = await import('mapbox-gl')

        const token = 'pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw'

        mapboxgl.accessToken = token

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
        })

        for (let i = 0; i < 100; i += 1) {
            const lat = Math.random() * 180 - 90
            const lng = Math.random() * 360 - 180

            new mapboxgl.Marker()
                    .setLngLat([lng, lat])
                    .addTo(map)
        }
    })
</script>

<section id="map"></section>
