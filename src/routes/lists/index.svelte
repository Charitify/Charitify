<script>
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import { ListItems } from '../../layouts'

    let chariries = []

    onMount(async () => {
        await new Promise(r => setTimeout(r, 2000))
        const chars = await api.getCharities()
        chariries = new Array(1).fill(chars).reduce((a, o) => a.concat(...o), [])
    })
</script>

<ListItems items={chariries}/>

<style>
</style>
