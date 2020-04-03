<script>
    import { stores } from "@sapper/app";
    import { onMount } from "svelte";
    import { API } from "@services";
    import { delay, safeGet } from "@utils";
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

    // Entities
    let organization = {};
    let comments = []
    
    $: carouselTop = (organization.avatars || []).map((a, i) => ({ src: a.src, srcBig: a.src2x, alt: a.title }));
    $: descriptionShort = {
        title: organization.title,
        text: organization.subtitle,
    };
    $: iconsLine = {
        likes: organization.likes,
        views: organization.views,
    };
    $: descriptionBlock = {
        title: organization.title,
        text: organization.description,
    };
    $: contacts = {
        phone: safeGet(() => organization.contacts.phone),
        email: safeGet(() => organization.contacts.email),
        location: safeGet(() => organization.contacts.location),
        telegram: safeGet(() => organization.contacts.telegram),
        facebook: safeGet(() => organization.contacts.facebook),
        viber: safeGet(() => organization.contacts.viber),
    };
    $: donators = safeGet(() => organization.donators.map(d => ({
        id: d.id,
        title: `${d.currency} ${d.amount}`,
        subtitle: d.name,
        src: d.avatar,
        src2x: d.avatar2x,
    })), [], true);
    $: documents = safeGet(() => organization.documents.map(d => ({
        id: d.id,
        title: d.title,
        src: d.src,
        src2x: d.src2x,
    })), [], true);
    $: media = safeGet(() => organization.media.map(d => ({
        id: d.id,
        alt: d.title,
        src: d.src,
        srcBig: d.src2x,
        description: d.description,
    })), [], true);
    $: commentsData = {
        comments: safeGet(() => comments.map(c => ({
            likes: c.likes,
            avatar: c['author.avatar'],
            author: c['author.name'],
            comment: c.comment,
            checked: c.checked,
            reply_to: c.reply_to,
            created_at: c.created_at,
        }))),
    };

    onMount(async () => {
        await delay(2000)
        organization = await API.getOrganization(1);
        comments = await API.getComments()
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

    <TopCarousel items={carouselTop}/>
    <Br size="60" />

    <DescriptionShort title={descriptionShort.title} text={descriptionShort.text}/>
    <Br size="10" />

    <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views}/>
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

    <Donators items={donators}/>
    <Br size="60" />

    <LastNews />
    <Br size="60" />

    <Certificates items={documents}/>
    <Br size="45" />

    <Videos items={media}/>
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
