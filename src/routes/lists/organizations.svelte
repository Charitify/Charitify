
<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { Br, ListItems } from '@components'

    let organizations = []

    onMount(async () => {
        // await new Promise(r => setTimeout(r, 1000))
        const orgs = await API.getOrganizations()
        organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), [])
    })
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<ListItems items={organizations} basePath="organizations"/>
<ListItems items={organizations} basePath="organizations"/>
