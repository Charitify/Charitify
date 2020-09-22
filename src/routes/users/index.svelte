<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { safeGet } from '@utils'
    import { user as userMock } from '@mock'
    import { Br, ListItems, StatusCard, Button, Loader, SearchLine } from '@components'

    let users = []
    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        await new Promise(r => setTimeout(r, 1000))
        users = await API.getUsers().catch(() => new Array(10).fill(userMock))
        loading = false
    }

    function getItem(item) {
        return {
            src: 'https://www.stevensegallery.com/60/60',
            title: item.full_name,
            subtitle: item.email,
            progress: 100,
            liked: item.is_liked,
        }
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<section class="filters theme-bg container shadow-secondary relative">
    <Br size="var(--header-height)"/>
    <Br size="20"/>
    <SearchLine/>
    <Br size="var(--screen-padding)"/>
</section>

<div class="container overflow-hidden">
    <Br size="var(--screen-padding)"/>
    <br>

    {#if !users.length && !loading}
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
    {:else if !users.length && loading}
        <Loader />
    {:else if users.length}
        <ListItems items={users} basePath="users" type="fund" {getItem}/>
    {/if}

    <br>
    <br>
</div>

