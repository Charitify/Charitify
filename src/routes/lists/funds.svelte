<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<script>
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import { ListItems, ListsLayout } from '../../components'

    let chariries = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 1000))
        const chars = await api.getFunds()
        chariries = new Array(5).fill(chars).reduce((a, o) => a.concat(...o), [])
    })
</script>

<ListsLayout>
    <ListItems items={chariries} basePath="funds"/>
</ListsLayout>

<style>
</style>
