<script>
    import { getContext, createEventDispatcher } from 'svelte'
    import { contextMapbox } from './context'

    const dispatch = createEventDispatcher()

    const { getMap, getMapbox } = getContext(contextMapbox)

    const map = getMap()
    const mapbox = getMapbox()

    export let lng
    export let lat
    // export let label = 'label'

    // const popup = new mapbox.Popup({ offset: 25 }).setText(label)

    const markerEl = document.createElement('div');
    markerEl.style.fontSize = '50px';
    markerEl.style.cursor = 'pointer';
    markerEl.innerHTML = '📍';

    const marker = new mapbox.Marker(markerEl, { offset: [0, -25] })
            .setLngLat([lng, lat])
            // .setPopup(popup)
            .addTo(map)

    markerEl.addEventListener('click', dispatch.bind(null, 'click'))
</script>

