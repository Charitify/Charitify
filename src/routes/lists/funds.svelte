<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { funds } from '@store'
    import { Br, ListItems, StatusCard, Button, Loader } from '@components'

    let loading = true

    onMount(loadEntity)

    async function loadEntity() {
        loading = true
        funds.set(await API.getFunds().catch(() => null))
        loading = false
    }

    function getItem(item) {
        return {
            id: item._id,
            src: item.logo,
            title: item.title,
            subtitle: item.description,
            current_sum: item.current_sum,
            need_sum: item.needed_sum,
            progress: +Math.min(100, Number.isFinite(item.progress) ? item.progress * 100 : item.current_sum / item.needed_sum * 100).toFixed(2),
            liked: item.is_liked,
        }
    }
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

{#if (!$funds || !$funds.length) && !loading}
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
{:else if (!$funds || !$funds.length) && loading}
    <Loader />
{:else if ($funds && $funds.length)}
    <ListItems items={$funds} basePath="funds" type="fund" {getItem}/>
{/if}
