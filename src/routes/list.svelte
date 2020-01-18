<script>
    import { Swipe, SwipeItem } from '../plugins'
    import {
        Carousel,
        CharityCards,
        TitleSubTitle,
        AvatarAndName,
        DonatingGroup,
    } from '../layouts'
    import { Rate, Divider, Progress } from '../components'
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
</style>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>

<section class="container">
    <section class="top">

        <div class="pics-wrap">
            <Carousel/>
        </div>

        <DonatingGroup/>
    </section>

    <Progress value="65" size="big"></Progress>

    <section class="rate-section">
        <AvatarAndName
                src="https://placeimg.com/300/300/people"
                title="Tina Kandelaki"
                subtitle="ORG charity charitify"
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
    <CharityCards/>
</div>

<br>
<br>
<br>
<br>
<br>

<div class="container">
    <CharityCards/>
</div>

<br>
<br>
<br>
<br>
<br>
