
<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { Br, ListItems, Button, StatusCard } from '@components'

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

<!-- <ListItems items={organizations} basePath="organizations" type="organization"/> -->
