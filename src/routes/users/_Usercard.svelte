 <script>
    import { Br, Card, Avatar, Loader, SocialsX, SocialsY } from '@components'

    export let src = null
    export let items = null
    export let title = null
    export let subtitle = null

    const top = ['telegram', 'facebook', 'viber']

    $: topItems = items === null ? undefined : items.filter(i => !top.includes(i.type))
    $: bottomItems = items === null ? undefined : items.filter(i => top.includes(i.type))
</script>

<Card class="container">
    <Br size="30"/>

    <div class="text-center flex flex-column flex-align-center">
        <Avatar {src} size="big"/>
        <Br size="20"/>
        {#if title !== null}
            <h2>{title}</h2>
        {:else}
            <div style="width: 200px"><Loader type="h2"/></div>
        {/if}
        <Br size="4"/>
        {#if title !== null}
            <h4>{subtitle}</h4>
        {:else}
            <div style="width: 100px"><Loader type="h2"/></div>
        {/if}
    </div>

    <Br size="30"/>

    <SocialsY items={topItems}/>  

    <Br size="30"/>

    <SocialsX items={bottomItems}/>  

    <Br size="30"/>  
</Card>