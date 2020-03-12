<script>
    import DonatorsCard from './DonatorsCard.svelte'

    const cardSample = {
        src: 'https://placeimg.com/300/300/people',
        title: '10грн',
        subtitle: 'Tina Kandelaki de-junior de-junior',
    }

    const all = new Array(5).fill(cardSample)

    const grouped = all.map(one => new Array(3).fill(one))
</script>

<ul class="scroll-center">
    {#each grouped as cards}
        <li>
            <DonatorsCard items={cards} />
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: flex;
        flex-direction: row-reverse;
        align-items: flex-start;
        max-width: 100%;
        overflow-y: hidden;
        overflow-x: auto;
        padding: var(--screen-padding) 0;
    }

    li {
        align-self: stretch;
        width: 300px;
        padding: 0 5px;
    }

    li:last-child {
        padding-left: 15px;
    }

    li:first-child {
        padding-right: 15px;
    }
</style>
