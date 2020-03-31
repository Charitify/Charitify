<script>
    import { stores } from "@sapper/app";
    import { onMount } from "svelte";
    import { API } from "@services";
    import { Br, Footer } from "@components";

    import OrganizationButton from './_OrganizationButton.svelte'
    import TopCarousel from './_TopCarousel.svelte'
    import DescriptionShort from './_DescriptionShort.svelte'
    import InteractionIndicators from './_InteractionIndicators.svelte'
    import FundList from './_FundList.svelte'
    import Description from './_Description.svelte'
    import Share from './_Share.svelte'
    import Trust from './_Trust.svelte'
    import Donators from './_Donators.svelte'
    import LastNews from './_LastNews.svelte'
    import Certificates from './_Certificates.svelte'
    import Videos from './_Videos.svelte'
    import ContactsCard from './_ContactsCard.svelte'
    import VirtualTour from './_VirtualTour.svelte'
    import WeOnMap from './_WeOnMap.svelte'
    import Comments from './_Comments.svelte'

    const { page } = stores();

    // Organization
    let organizationId = $page.params.id;

    let organization = {};
    
    $: carousel = (organization.avatars || []).map(p => ({
        src: p.src,
        src2x: p.src2x,
        alt: p.title,
    }));

    onMount(async () => {
        organization = await API.getOrganization(1);
    });
</script>

<style>

</style>

<svelte:head>
    <title>Charitify - Organization page.</title>
</svelte:head>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)" />
    <Br size="30" />

    <OrganizationButton />
    <Br size="20" />

    <TopCarousel items={carousel}/>
    <Br size="60" />

    <DescriptionShort />
    <Br size="10" />

    <InteractionIndicators />
    <Br size="50" />

    <FundList title="Фонди тварин"/>
    <Br size="45" />

    <FundList title="Інші фонди"/>
    <Br size="45" />

    <Description/>
    <Br size="10" />

    <Share />
    <Br size="50" />

    <Trust />
    <Br size="50" />

    <Donators />
    <Br size="60" />

    <LastNews />
    <Br size="60" />

    <Certificates />
    <Br size="45" />

    <Videos items={carousel}/>
    <Br size="70" />

    <ContactsCard/>
    <Br size="60" />

    <VirtualTour />
    <Br size="60" />

    <WeOnMap />
    <Br size="60" />

    <Comments />
    <Br size="40" />

    <div class="full-container">
        <Footer />
    </div>

</section>
