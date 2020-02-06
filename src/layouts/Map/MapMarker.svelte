<script>
    import { getContext } from 'svelte'
    import { contextMapbox } from './context'

    const { getMap, getMapbox } = getContext(contextMapbox)

    const map = getMap()
    const mapbox = getMapbox()

    export let lng
    export let lat
    export let label = 'label'

    const popup = new mapbox.Popup({ offset: 25 }).setText(label)

    const marker = new mapbox.Marker()
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map)
</script>

