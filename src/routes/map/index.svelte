<svelte:head>
    <title>Charitify - Map of organizations.</title>
</svelte:head>

<style>
</style>

<script>
    import { stores, goto } from '@sapper/app';
    const { page } = stores();
    import { api } from '@services'
    import { Map, MapMarker } from '@components'

    let organizations = []

    async function onCreate({ detail: map }) {
        await new Promise(r => setTimeout(r, 2000))
        organizations = await api.getOrganizations()

        console.log(organizations)

        const getRange = (type, metric) => Math[type](...organizations.map(o => o.location[metric]))

        const scale = -2
        const area = [
            [getRange('min', 'lng') + scale, getRange('min', 'lat') + scale],
            [getRange('max', 'lng') - scale, getRange('max', 'lat') - scale]
        ]
        map.fitBounds(area);
    }

    async function onMarkerClick(organization) {
        goto(`organizations/${organization.id}`)
    }
</script>

<Map on:ready={onCreate}>
    {#each organizations as o}
        <MapMarker lat={o.location.lat} lng={o.location.lng} on:click={onMarkerClick.bind(null, o)}/>
    {/each}
</Map>
