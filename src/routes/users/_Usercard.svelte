 <script>
    import { safeGet } from '@utils'
    import { Br, Card, Icon, Button } from '@components'
    import { UserCardView, UserCardEdit } from './_components'

    export let src = null
    export let srcBig = null
    export let items = null
    export let title = null
    export let subtitle = null

    const top = ['telegram', 'facebook', 'viber']

    let isViewMode = true

    $: itemsX = items === null ? null : safeGet(() => items.filter(i => top.includes(i.type)))
    $: itemsY = items === null ? null : safeGet(() => items.filter(i => !top.includes(i.type)))
</script>

<Card class="container">
    <Br size="30"/>

    {#if isViewMode}
        <UserCardView
                {src}
                {srcBig}
                {title}
                {subtitle}
                {itemsX}
                {itemsY}
        />
    {:else}
        <UserCardEdit
                {src}
                {title}
                {subtitle}
        />
    {/if}

    <Br size="30"/>

    <Button size="small" is={isViewMode ? "info" : ''} on:click={() => isViewMode = !isViewMode}>
        {#if isViewMode}
            <span class="h3 font-secondary font-w-500 flex flex-align-center">
                Редагувати
                <s></s>
                <s></s>
                <Icon type="edit" size="small" is="light"/>
            </span>
        {:else}
            <span class="h3 font-secondary font-w-500 flex flex-align-center">
                Переглянути
            </span>
        {/if}
    </Button>

    <Br size="30"/>
</Card>
