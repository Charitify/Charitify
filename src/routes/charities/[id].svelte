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
    import { Rate, Progress, Carousel, Divider } from '../../components'

    let charityId = $page.params.id
    let charity = {}

    $: carousel = (charity.avarars || []).map(src => ({ src }))

    onMount(async () => {
        await new Promise(r => setTimeout(r, 2000))
        charity = await api.getCharity(1)
    })

    $: console.log(charityId)
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

<section class="container scroll-box">

    <section class="top">
        <div class="pics-wrap">
            <Carousel items={carousel}/>
        </div>

        <DonatingGroup/>
    </section>

    <Progress value="65" size="big"/>

    <a class="rate-section" href={`organizations/${charity.org_id}`}>
        <AvatarAndName
                src={charity.org_head_avatar}
                title={charity.org_head}
                subtitle={charity.organization}
        />

        <Rate/>
    </a>

    <section>
        <br>
        <TitleSubTitle
                title={charity.title}
                subtitle={charity.description}
        />
        <br>
    </section>

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
    <br>
    <br>

    <Divider size="16"/>
    <h3 class="h2 text-right">Other charities of the organization:</h3>
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
    <br>
    <br>

    <ContactsHolder/>

    <br>
    <br>
    <br>
    <br>
    <br>

    <Divider size="16"/>
    <h3 class="h2 text-right">Similar of the organization:</h3>
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

</section>

<Footer/>

