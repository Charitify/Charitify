<script>
    import Divider from '../Divider.svelte'
    import CharityCard from './CharityCard.svelte'

    export let listName
    export let amount = 2

    $: cards = [
        {
            src: 'https://placeimg.com/300/300/tech',
            title: 'This person needs your help',
            percent: 45,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'Head of the organization with loooooooong-naaaaaamed charity',
        },
        {
            src: 'https://placeimg.com/300/300/arch',
            title: 'Another person who needs your quick help',
            percent: 65,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'Head of another organization',
        },
        {
            src: 'https://placeimg.com/300/300/any',
            title: 'The person with the longest name is also wait for you',
            percent: 5,
            orgHead: 'Tinaramisimuss el-de-la Kandelakinuskas',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG of charity',
        },
        {
            src: 'https://placeimg.com/300/300/nature',
            title: 'Needs',
            percent: 95,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG giant charity organization of big Charitify company',
        },
    ].slice(Number.isFinite(+amount) ? +amount : 0)

    $: images = cards.map(card => ({
        src: [card.src, card.src, card.src],
        alt: card.title,
    }))
</script>

<section>
    {#if listName}
        <Divider size="16"/>
        <h3 class="h2 text-right">{listName}</h3>
        <Divider size="20"/>
        <br>
    {/if}
    <ul class="cards">
        {#each cards as card}
            <li>
                <CharityCard {...card}/>
            </li>
        {/each}
    </ul>
</section>

<style>
    section {
        flex-grow: 1;
        align-self: stretch;
        max-width: 100%;
        padding: 0 10px;
    }

    .cards {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: center;
        padding: var(--screen-padding) 0;
        margin: calc(var(--screen-padding) * -3) calc(var(--screen-padding) * -1);
    }

    .cards li {
        display: flex;
        justify-content: stretch;
        width: 50%;
        overflow: hidden;
        padding: calc(var(--screen-padding) * 3) var(--screen-padding);
    }

    .cards li:hover {
        background-color: rgba(0, 0, 0, .1)
    }
</style>
