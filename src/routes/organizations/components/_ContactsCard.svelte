<script>
    import { Br, Card, Icon, Avatar, FancyBox, Loader, SocialsX, SocialsY } from '@components'

    export let items = null
    export let orgName = null
    export let avatar = null
    export let avatarBig = null

    const top = ['telegram', 'facebook', 'viber']

    $: topItems = items === null ? undefined : items.filter(i => !top.includes(i.type))
    $: bottomItems = items === null ? undefined : items.filter(i => top.includes(i.type))
</script>

<Card>
    <section style="padding: 0 20px">
        <Br size="30" />

        <div class="flex flex-column flex-align-center">
            
            <span>
                <FancyBox class="flex-justify-center">
                    <Avatar size="big" src={avatar} alt="Організація"/>
                    <section slot="box" class="flex full-width full-height" style="height: 100vw">
                        <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                            <Avatar src={avatar} srcBig={avatarBig} alt="ava"/>
                        </div>
                    </section>
                </FancyBox>
            </span>

            <Br size="20" />
            <h2>Наші контакти</h2>
            <Br size="5" />

            {#if orgName !== null}
                <p class="h3 font-secondary font-w-500 text-center" style="opacity: .7">
                    {orgName || ''}
                </p>
            {:else}
                <p style="width: 60%">
                    <Loader type="h3"/>
                </p>
            {/if}
        </div>

        <Br size="30" />

        <SocialsY items={topItems} />   

        <Br size="30" />

        <SocialsX items={bottomItems} />

        <Br size="30" />
    </section>
</Card>

<style>
</style>
