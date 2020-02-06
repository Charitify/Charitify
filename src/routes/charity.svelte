<script>
    import { TitleSubTitle, AvatarAndName, DonatingGroup, CharityCards, Footer } from '../layouts'
    import { Rate, Progress, Carousel } from '../components'
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

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
        padding: 12px 0;
    }
</style>

<section class="container">

    <section>
        <br>
        <TitleSubTitle/>
        <br>
    </section>

    <section class="top">
        <div class="pics-wrap">
            <Carousel/>
        </div>

        <DonatingGroup/>
    </section>

    <Progress value="65" size="big"/>

    <section class="rate-section">
        <AvatarAndName
                src="https://placeimg.com/300/300/people"
                title="Tina Kandelaki"
                subtitle="ORG charity charitify"
        />

        <Rate/>
    </section>
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

<Footer/>

