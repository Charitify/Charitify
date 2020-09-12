<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { Br, ListItems, StatusCard, Button, Loader } from '@components'

    let chariries = []
    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        await new Promise(r => setTimeout(r, 1000))
        const chars = await API.getFunds()
        chariries = new Array(10).fill(chars).reduce((a, o) => a.concat(...o), [])
        loading = false
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

{#if !chariries.length && !loading}
    <Br size="10"/>
    <StatusCard 
        status="Упс"
        src="/assets/notFoundIllustration.svg"
        text="Тут поки нічого немає"
    >
        <Button href="/" type="primary" is="info" style="max-width: 300px">
            <span class="h3 font-secondary font-w-500">До головної сторінки</span>
        </Button>
    </StatusCard>
    <Br size="40"/>
{:else if !chariries.length && loading}
    <Loader />
{:else if chariries.length}
    <ListItems items={chariries} basePath="funds" type="fund"/>
{/if}
