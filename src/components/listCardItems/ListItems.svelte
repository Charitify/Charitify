<script>
    import Br from '../Br.svelte'
    import ListItem from './ListItem.svelte'
    import { safeGet } from '@utils'

    export let type // fund / organization
    export let items = []
    export let basePath = ''

    function getItem(item) {
        return {
            src: safeGet(() => type === 'fund' ? item.avatars[0].src : item.avatars[0]),
            title: item.title,
            subtitle: type === 'fund' ? item.subtitle : item.description,
            progress: type === 'fund' ? +(item.current_sum / item.need_sum * 100).toFixed(2) : item.percent,
            liked: item.is_liked,
        }
    }

    $: console.log(items)
</script>

{#each items as item}
    <a href={`${basePath}/${item.id}`} class="block">
        <ListItem {basePath} item={getItem(item)}>
            <div slot="bottom-left" class="flex flex-align-baseline">
                {#if type === 'fund'}
                    <span class="h2 font-secondary">{item.current_sum}{item.currency || ''} /<s/></span>
                    <span class="h4 font-secondary">{item.need_sum}{item.currency || ''}</span>
                {:else if type === 'organization'}
                    <span class="h2 font-secondary">{getItem(item).progress || '0'}%</span>
                {/if}
            </div>
        </ListItem>
    </a>
    <Br size="20"/>
{/each}
