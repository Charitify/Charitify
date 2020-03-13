<script>
    import { Card, Avatar, Icon } from '../components'

    export let items
</script>

{#if Array.isArray(items) && items.length}
    <Card>
        <ul class="full-width">
            {#each items as item}
                {#if item.title && item.src}
                    <li>
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
        border-bottom: 1px dashed rgba(var(--color-black), 0.1);
    }
</style>
