<script>
    import { Br, Avatar, Loader, FancyBox, SocialsX, SocialsY } from '@components'

    export let src
    export let srcBig
    export let title
    export let subtitle
    export let itemsX
    export let itemsY
</script>

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
    {#if title !== undefined}
    {#if title !== null}
        <h2>{title || ''}</h2>
    {:else}
        <div style="width: 200px"><Loader type="h2"/></div>
    {/if}
    {/if}
    <Br size="4"/>
    {#if title !== undefined}
    {#if title !== null}
        <p>{subtitle || ''}</p>
    {:else}
        <div style="width: 100px"><Loader type="p"/></div>
    {/if}
    {/if}
</div>

{#if Array.isArray(itemsX)}
    <Br size="30"/>
    <SocialsX items={itemsX}/>
{/if}

{#if Array.isArray(itemsY)}
    <Br size="30"/>
    <SocialsY items={itemsY}/>
{/if}
