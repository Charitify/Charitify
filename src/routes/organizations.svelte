<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<script>
    import { onMount } from 'svelte'
    import { api } from '../services'
    import { SearchLine, ListItems, Footer } from '../layouts'

    let organizations = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 2000))
        const orgs = await api.getOrganizations()
        organizations = new Array(5).fill(orgs).reduce((a, o) => a.concat(...o), [])
    })
</script>

<div class="search theme-bg container">
    <br>

    <SearchLine/>

    <br>
</div>

<div class="list-wrap">
    <br>

    <ListItems items={organizations}/>

    <br>
    <br>
</div>

<Footer/>

<style>
    .search {
        position: sticky;
        top: 47px;
        box-shadow: var(--shadow-primary);
    }

    .list-wrap {
        flex: 1 1 auto;
        padding: 0 var(--screen-padding)
    }
</style>
