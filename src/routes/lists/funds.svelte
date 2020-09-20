<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { fund } from '@mock'
    import { Br, ListItems, StatusCard, Button, Loader } from '@components'

    let funds = []
    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        await new Promise(r => setTimeout(r, 1000))
        funds = await API.getFunds().catch(() => new Array(10).fill(fund))
        loading = false
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

{#if !funds.length && !loading}
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
{:else if !funds.length && loading}
    <Loader />
{:else if funds.length}
    <ListItems items={funds} basePath="funds" type="fund"/>
{/if}
