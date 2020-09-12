
<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { Br, Loader, ListItems, Button, StatusCard } from '@components'

    let organizations = []
    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        await new Promise(r => setTimeout(r, 1000))
        const orgs = await API.getOrganizations()
        organizations = new Array(15).fill(orgs).reduce((a, o) => a.concat(...o), [])
        loading = false
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

{#if !organizations.length && !loading}
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
{:else if !organizations.length && loading}
    <Loader />
{:else if organizations.length}
    <ListItems items={organizations} basePath="organizations" type="organization"/>
{/if}
