<script>
    import { stores } from '@sapper/app';
    const { page } = stores();
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import {
        Footer,
        Comments,
        CharityCards,
        TitleSubTitle,
        AvatarAndName,
        DonatingGroup,
        ContactsHolder,
    } from '../../layouts'
    import { Button, Progress, Carousel, Divider, Card, Icon } from '../../components'

    let charityId = $page.params.id

    let charity = {}

    $: carousel = (charity.avatars || []).map(p => ({ src: p, alt: 'photo' }))

    onMount(async () => {
        charity = await api.getFund(1)
    })
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
    .top {
        height: 200px;
        display: flex;
        margin-bottom: calc(var(--screen-padding) * 1.5);
        margin-top: var(--screen-padding);
    }
</style>

<section class="container scroll-box theme-bg-color-secondary">

    <br>

    <section class="top">
        <Carousel items={carousel}/>
    </section>

    <Button class="white">
        OrgAva
    </Button>

    <br>

    <Card class="container">
        <br>
        <br class="small">

        <h2>Save dogs together</h2>
        <br class="small">
        <h4 style="color: rgba(var(--color-black), .7)">Racing money for charity</h4>

        <br>
        <br class="small">

        <p>
            <span class="h1">600$</span>
            <span class="h3"> / 1150$</span>
        </p>

        <br>

        <Progress value="60"/>

        <br class="big">
    </Card>

    <br>

        <p class="container flex flex-justify-between flex-align-center">
            <span class="flex flex-align-center">
                <Icon is="danger" type="heart-filled"/>
                <s></s>
                23
            </span>
            <span class="flex flex-align-center">
                <Icon is="dark" type="eye"/>
                <s></s>
                120
            </span>
        </p>

    <br class="big">

    <h2>Save dogs together</h2>
    <br>
    <p>
        But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and
        I will give you a complete account of the system, and expound the actual teachings I must explain to you how
        all this mistaken idea of denouncing pleasure and praising pain was born and I will give
    </p>

</section>

<Footer/>

