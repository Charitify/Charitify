<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<script>
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import { ListItems, ListsLayout } from '../../layouts'

    let organizations = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 1000))
        const orgs = await api.getOrganizations()
        organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), [])
    })
</script>

<ListsLayout>
    <ListItems items={organizations} basePath="organizations"/>
</ListsLayout>

<style>
</style>
