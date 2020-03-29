<script>
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Avatar from '@components/Avatar.svelte'
    import FancyBox from '@components/FancyBox.svelte'

    export let items
    export let setFancyActive = () => {}
</script>

{#if Array.isArray(items) && items.length}
    <Card>
        <ul class="full-width">
            {#each items as item}
                {#if item.title && item.src}
                    <li>
                        <div class="relative">
                            <FancyBox on:open={() => setFancyActive(true)} on:close={() => setFancyActive(false)}>
                                <Avatar src={item.src} size="medium" alt={item.subtitle}/>
                                <section slot="box" class="flex full-width full-height" style="height: 100vw">
                                    <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                                    <Avatar src={item.src} alt={item.subtitle}/>
                                </div>
                                </section>
                            </FancyBox>
                            {#if item.checked}
                                <div class="absolute flex" style="top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden">
                                    <Icon type="polygon" is="info"/>
                                    <div class="absolute-center flex" style="width: 10px; height: 10px;">
                                        <Icon type="check-flag" is="light"/>
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <s></s>
                        <s></s>
                        <s></s>
                        <s></s>
                        <div style="overflow: hidden;" class="flex flex-column flex-justify-center">
                            <h2 class="text-ellipsis">{ item.title }</h2>
                            <span class="h4 font-w-300 text-ellipsis">{ item.subtitle }<span/>
                        </div>
                    </li>
                {/if}
            {/each}
        </ul>
    </Card>
{/if}

<style>
    li {
        display: flex;
        align-items: center;
        padding: 20px;
        width: 100%;
    }

    li:not(:last-child) {
        background-image: linear-gradient(to right, rgba(var(--theme-color-primary-opposite), 0.1) 50%, rgba(var(--theme-color-primary-opposite), 0) 0%);
        background-position: bottom;
        background-size: 20px 1px;
        background-repeat: repeat-x;
    }
</style>
