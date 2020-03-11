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
    import { Button, Progress, Carousel, Divider, Card } from '../../components'

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
    <br>

    <Card class="container">
        <br>

        some content

        <br>
        <br>

        <Progress value="60"/>
        <br>
        <Progress value="100"/>

        <br>
    </Card>

</section>

<Footer/>

