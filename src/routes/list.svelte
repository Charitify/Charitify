<script>
    import { Swipe, SwipeItem } from '../plugins'
    import {
        Carousel,
        CharityCard,
        TitleSubTitle,
        AvatarAndName,
        DonatingGroup,
    } from '../layouts'
    import { Rate, Divider, Progress } from '../components'

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
    .top {
        display: flex;
        margin-bottom: calc(var(--screen-padding) * 1.5);
        margin-top: var(--screen-padding);
    }

    .pics-wrap {
        z-index: 0;
        flex-grow: 1;
        display: flex;
        overflow: hidden;
        margin-bottom: 2px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-primary);
    }

    .rate-section {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: calc(var(--screen-padding) * 1.5) 0;
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

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<section class="container">
    <section class="top">

        <div class="pics-wrap">
            <Carousel {images}/>
        </div>

        <DonatingGroup/>
    </section>

    <Progress value="65" size="big"></Progress>

    <section class="rate-section">
        <AvatarAndName
                src="https://placeimg.com/300/300/people"
                title="Tina Kandelaki"
                subTitle="ORG charity charitify"
        />

        <Rate/>
    </section>

    <br>
    <br>

    <TitleSubTitle/>
</section>

<br>
<br>
<br>

<div class="container">
    <Divider size="16"/>
    <h2 style="text-align: right">The nearest list:</h2>
    <Divider size="20"/>

    <br>

    <ul class="cards">
        {#each cards as card}
            <li>
                <CharityCard {...card}/>
            </li>
        {/each}
    </ul>
</div>

<br>
<br>
<br>
<br>
<br>

<div class="container">
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
</div>

<br>
<br>
<br>
<br>
