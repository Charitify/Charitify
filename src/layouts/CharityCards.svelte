<script>
    import { Divider } from '../components'
    import CharityCard from '../layouts/CharityCard.svelte'

    export let amount = 2

    $: cards = [
        {
            src: 'https://placeimg.com/300/300/tech',
            title: 'The main title and short description.',
            percent: 45,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/arch',
            title: 'Second bigger major card title line with a bit longer description.',
            percent: 65,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/any',
            title: 'The main title and short description.',
            percent: 5,
            orgHead: 'Tinaramisimuss Kandelakinuskas',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/nature',
            title: 'The main title and short description.',
            percent: 95,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG giant charity organization of big Charitify company.',
        },
    ].slice(Number.isFinite(+amount) ? +amount : 0)

    $: images = cards.map(card => ({
        src: [card.src, card.src, card.src],
        alt: card.title,
    }))
</script>

<Divider size="16"/>
<h2 style="text-align: right">The second list:</h2>
<Divider size="20"/>
<br>
<ul class="cards">
    {#each cards as card}
        <li>
            <CharityCard {...card}/>
        </li>
    {/each}
</ul>

<style>
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
