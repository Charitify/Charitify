<script>
    import { onMount } from 'svelte'
    import { api } from '../services'
    import {
        Footer,
        Comments,
        CharityCards,
        TitleSubTitle,
        AvatarAndName,
        DonatingGroup,
        ContentHolder,
        ContactsHolder,
    } from '../layouts'
    import { Rate, Progress, Carousel, Divider } from '../components'

    let organization = {}

    $: carousel = (organization.avatars || []).map(src => ({ src }))

    onMount(async () => {
        await new Promise(r => setTimeout(r, 2000))
        organization = await api.getOrganization(1)
    })
</script>

<svelte:head>
    <title>Charitify - Organization page.</title>
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
        <TitleSubTitle
                title={organization.title}
                subtitle={organization.description}
        />
        <br>
    </section>

    <section class="top">
        <div class="pics-wrap">
            <Carousel items={carousel}/>
        </div>

        <DonatingGroup/>
    </section>

    <Progress value="65" size="big"/>

    <section class="rate-section">
        <AvatarAndName
                src={organization.org_head_avatar}
                title={organization.org_head}
        />

        <Rate/>
    </section>

    <br>
    <br>
    <br>

    <ContentHolder/>

    <br>
    <br>
    <br>
    <br>
    <br>

    <Divider size="16"/>
    <h3 class="h2 text-right">Charities of the organization:</h3>
    <Divider size="20"/>
    <br>
    <Carousel amount="5">
        <CharityCards amount="2"/>
    </Carousel>


    <br>
    <br>
    <br>
    <br>
    <br>

    <ContactsHolder/>

    <br>
    <br>
    <br>
    <br>
    <br>

    <Divider size="20"/>
    <h3 class="h2 text-right">Comments:</h3>
    <Divider size="16"/>

    <Comments/>

    <br>
    <br>
    <br>
    <br>
    <br>

</section>

<Footer/>

