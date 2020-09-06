<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { Br, ListItems } from '@components'

    let chariries = []

    onMount(async () => {
        // await new Promise(r => setTimeout(r, 1000))
        const chars = await API.getFunds()
        chariries = new Array(15).fill(chars).reduce((a, o) => a.concat(...o), [])
    })
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<ListItems items={chariries} basePath="funds"/>
