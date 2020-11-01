
<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { organizations } from '@store'
    import { Br, Loader, ListItems, Button, StatusCard } from '@components'

    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        organizations.set(await API.getOrganizations().catch(() => null))
        loading = false
    }

    function getItem(item) {
        return {
            ...item,
            id: item._id,
            src: item.logo,
            title: item.name,
            subtitle: item.description,
            progress: +Math.min(100, Number.isFinite(item.progress) ? item.progress * 100 : item.current_sum / item.needed_sum * 100).toFixed(2),
            liked: item.is_liked,
        }
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

{#if (!$organizations || !$organizations.length) && !loading}
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
{:else if (!$organizations || !$organizations.length) && loading}
    <Loader />
{:else if $organizations && $organizations.length}
    <ListItems items={$organizations} basePath="organizations" type="organization" {getItem}/>
{/if}
