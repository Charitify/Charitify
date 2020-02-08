<script>
    import { onMount } from 'svelte'
    import { api } from '../../../services'
    import { ListItems } from '../../../layouts'

    let organizations = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 1000))
        const orgs = await api.getOrganizations()
        organizations = new Array(1).fill(orgs).reduce((a, o) => a.concat(...o), [])
    })
</script>

<ListItems items={organizations}/>

<style>
</style>
