<script>
    import { tick } from 'svelte'
    import DonatorsCard from './DonatorsCard.svelte'

    /**
     * @type {{
     *  id: string,
     *  src: string,
     *  title: string,
     *  subtitle: string,
     *  checked: boolean,
     * }[]}
     */
    export let items = []

    let itemsPrev = []
    let container = null
    let grouped = []
    
    $: grouped = items.reverse().reduce((acc, item) => {
        const lastInd = Math.max(acc.length - 1, 0)
        if (!Array.isArray(acc[lastInd])) {
            acc[lastInd] = []
        }
        if (acc[lastInd].length < 3) {
            acc[lastInd].push(item)
        } else {
            acc.push([])
        }
        return acc
    }, []).reverse()

    $: onItemsChange(items, container)

    async function onItemsChange(items, container) {
        if (items && items.length && !(itemsPrev && itemsPrev.length)) {
            await tick()
            scrollEnd(container)
        }
        itemsPrev = items
    }

    function scrollEnd(node) {
        try {
            node.scrollTo(node.scrollWidth, 0)
        } catch (err) {
            console.warn(`The Magic told me "${err.message}". It's a weird reason, I know, but I couldn't scroll to the end of ${node} with it: `, err)
        }
    }
</script>

<ul class="donators scroll-x-center" bind:this={container}>
    {#each grouped as cards}
        <li>
            <DonatorsCard items={cards}/>
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: flex;
        align-items: flex-start;
        max-width: 100%;
        overflow-y: hidden;
        overflow-x: auto;
        padding: var(--screen-padding) 0;
    }

    li {
        flex: none;
        align-self: stretch;
        width: 260px;
        padding: 0 5px;
    }

    li:first-child {
        padding-left: 15px;
    }

    li:last-child {
        padding-right: 15px;
    }
</style>
