<script>
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Avatar from '@components/Avatar.svelte'
    import Loader from '@components/loader'

    /**
     * @type {{
     *  id: string,
     *  src: string,
     *  title: string,
     *  subtitle: string,
     *  checked: boolean,
     * }}
     */
    export let items
</script>

{#if Array.isArray(items) && items.length}
    <Card>
        <ul class="full-width">
            {#each items as item}
                <li key={item.id}>
                    <div class="relative">
                        <Avatar src={item.src} size="medium" alt={item.subtitle}/>
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
                        {#if item.title !== null}
                            <h2 class="text-ellipsis">{ item.title }</h2>
                        {:else}
                            <span class="h2 relative flex-self-start">
                                <span style="visibility: hidden">₴ 1000</span>
                                <Loader type="h2" absolute/>
                            </span>  
                        {/if}

                        {#if item.subtitle !== null}
                            <span class="h4 font-w-300 text-ellipsis">{ item.subtitle }</span>
                        {:else}
                            <Loader type="h4"/>
                        {/if}
                    </div>
                </li>
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
