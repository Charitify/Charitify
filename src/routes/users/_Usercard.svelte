 <script>
    import { Br, Card, Icon, Button, Avatar, Loader, FancyBox, SocialsX, SocialsY } from '@components'

    export let src = null
    export let srcBig = null
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
        <span>
            <FancyBox class="flex-justify-center">
                <Avatar size="big" {src} alt="Організація"/>
                <section slot="box" class="flex full-width full-height" style="height: 100vw">
                    <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                        <Avatar {src} {srcBig} alt="ava"/>
                    </div>
                </section>
            </FancyBox>
        </span>

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

    <SocialsX items={bottomItems}/>

    <Br size="30"/>

    <SocialsY items={topItems}/>

    <Br size="30"/>

    <Button size="small" is="info">
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            Редагувати
            <s></s>
            <s></s>
            <Icon type="edit" size="small" is="light"/>
        </span>
    </Button>

    <Br size="30"/>
</Card>
