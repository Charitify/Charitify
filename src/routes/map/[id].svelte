<svelte:head>
    <title>Charitify - Map of organizations.</title>
</svelte:head>

<style>
</style>

<script>
    import { stores, goto } from '@sapper/app';
    const { page } = stores();
    import { api } from '../../services'
    import { Map, MapMarker } from '../../components'

    let center = undefined
    let markerId = $page.params.id
    let organizations = []

    async function onCreate({ detail: map }) {
        organizations = await api.getOrganizations()

        console.log(organizations)

        const getRange = (type, metric) => Math[type](...organizations.map(o => o.location[metric]))

        const scale = -2
        const area = [
            [getRange('min', 'lng') + scale, getRange('min', 'lat') + scale],
            [getRange('max', 'lng') - scale, getRange('max', 'lat') - scale]
        ]
        const center = organizations.filter(org => org.id === markerId)[0]

        if (center) {
            map.flyTo({ center: [center.location.lng, center.location.lat], zoom: 10 });
        } else {
            map.fitBounds(area);
        }
    }

    async function onMarkerClick(organization) {
        goto(`organizations/${organization.id}`)
    }
</script>

<Map on:ready={onCreate} {center}>
    {#each organizations as o}
        <MapMarker lat={o.location.lat} lng={o.location.lng} on:click={onMarkerClick.bind(null, o)}/>
    {/each}
</Map>
