<script>
    import DonatorsCard from './DonatorsCard.svelte'

    const all = [
        {
            src: 'https://placeimg.com/300/300/people',
            title: '10грн',
            subtitle: 'Тіна Канделакі',
        },
        {
            src: 'https://placeimg.com/300/300/people',
            title: '250грн',
            subtitle: 'Bruce Lee',
            checked: true,
        },
        {
            src: 'https://placeimg.com/300/300/people',
            title: '1140грн',
            subtitle: 'Leonardo DiCaprio junior',
        },
        {
            src: 'https://placeimg.com/300/300/people',
            title: '50$',
            subtitle: 'Добра людина',
        },
        {
            src: 'https://placeimg.com/300/300/people',
            title: '5$',
            subtitle: 'Добра людина',
        },
    ]

    const grouped = all.map(one => new Array(3).fill(one))

    function scrollEnd(node) {
        try {
          node.scrollTo(node.scrollWidth, 0)
        } catch (e) {}
    }
</script>

<ul class="scroll-x-center" use:scrollEnd>
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
