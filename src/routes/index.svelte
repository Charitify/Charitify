<script>
    import { Carousel } from '../layouts'

    const cards = [
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
    ]

    const images = cards.map(card => ({
        src: [card.src, card.src, card.src],
        alt: card.title,
    }))
</script>

<style>
    .top-pic {
        flex: none;
        z-index: 0;
        width: 100%;
        height: 200px;
        overflow: hidden;
        display: flex;
        margin-bottom: 2px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-primary);
    }
</style>

<svelte:head>
    <title>Charitify - list of charities you can donate.</title>
</svelte:head>

<div class="top-pic">
    <Carousel {images}/>
</div>

<section class="container">


</section>
