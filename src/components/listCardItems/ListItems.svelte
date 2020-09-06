<script>
    import Br from '../Br.svelte'
    import ListItem from './ListItem.svelte'

    export let items = []
    export let basePath = ''

    $: console.log(items)
</script>

{#each items as item}
    <ListItem {basePath} {item} />
    <Br size="20"/>
{:else}
    <section class="item container">
        <p class="text-center">No organizations</p>
    </section>
{/each}

<style>
    .item {
        display: block;
        flex: 1 1 auto;
        padding: 20px;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius-big);
        background-color: rgba(var(--theme-bg-color));
    }
</style>
