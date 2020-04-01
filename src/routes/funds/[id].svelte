<script>
    import { stores } from '@sapper/app'
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { delay, safeGet, _ } from '@utils'
    import { Br, Footer, DonationButton } from '@components'

    import TopCarousel from './_TopCarousel.svelte'
    import OrganizationButton from './_OrganizationButton.svelte'
    import QuickInfoCard from './_QuickInfoCard.svelte'
    import InteractionIndicators from './_InteractionIndicators.svelte'
    import Description from './_Description.svelte'
    import Share from './_Share.svelte'
    import Trust from './_Trust.svelte'
    import AnimalCard from './_AnimalCard.svelte'
    import Donators from './_Donators.svelte'
    import Documents from './_Documents.svelte'
    import Media from './_Media.svelte'
    import HowToHelp from './_HowToHelp.svelte'
    import Comments from './_Comments.svelte'

    const { page } = stores()
    let charityId = $page.params.id

    // Entity
    let charity = {}
    
    $: carouselTop = (charity.avatars || []).map((a, i) => ({ src: a.src, srcBig: a.src2x, alt: a.title }));
    $: organization = (charity.organization || {});
    $: cardTop = {
        title: charity.title,
        subtitle: charity.subtitle,
        currentSum: charity.curremt_sum,
        neededSum: charity.need_sum,
        currency: charity.currency,
    };
    $: iconsLine = {
        likes: charity.likes,
        views: charity.views,
    };
    $: descriptionBlock = {
        title: charity.title,
        text: charity.description,
    };
    $: animal = {
        avatar: safeGet(() => charity.animal.avatars[0].src),
        avatar2x: safeGet(() => charity.animal.avatars2x[0].src2x),
        name: safeGet(() => charity.animal.name),
        breed: safeGet(() => charity.animal.breed),
        age: safeGet(() => (new Date().getFullYear()) - (new Date(charity.animal.birth).getFullYear()), 0, true),
        sex: safeGet(() => charity.animal.sex),
        sterilization: safeGet(() => charity.animal.sterilization),
        character: safeGet(() => charity.animal.character),
        characterShort: safeGet(() => charity.animal.character_short),
        lifestory: safeGet(() => charity.animal.lifestory.map(l => ({ ...l, date: new Date(l.date).toLocaleDateString() })), [], true),
        vaccination: safeGet(() => charity.animal.vaccination, [], true),
    };
    $: donators = safeGet(() => charity.donators.map(d => ({
        id: d.id,
        title: `${d.currency} ${d.amount}`,
        subtitle: d.name,
        src: d.avatar,
        src2x: d.avatar2x,
    })), [], true);
    $: documents = safeGet(() => charity.documents.map(d => ({
        id: d.id,
        title: d.title,
        src: d.src,
        src2x: d.src2x,
    })), [], true);
    $: media = safeGet(() => charity.media.map(d => ({
        id: d.id,
        alt: d.title,
        src: d.src,
        srcBig: d.src2x,
        description: d.description,
    })), [], true);

    onMount(async () => {
        await delay(2000)
        charity = await API.getFund(1)
    })
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
</style>

<DonationButton/>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>
    <Br size="30"/>

    <TopCarousel items={carouselTop}/>
    <Br size="40"/>

    <OrganizationButton organization={organization}/>
    <Br size="20"/>

    <QuickInfoCard cardTop={cardTop}/>
    <Br size="20"/>

    <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views}/>
    <Br size="50"/>

    <Description title={descriptionBlock.title} text={descriptionBlock.text}/>
    <Br size="10"/>

    <Share />
    <Br size="45"/>

    <Trust />
    <Br size="60"/>

    <AnimalCard animal={animal}/>
    <Br size="60"/>

    <Donators items={donators}/>
    <Br size="60"/>

    <Documents items={documents}/>
    <Br size="45"/> 

    <Media items={media}/>
    <Br size="60"/>

    <HowToHelp />
    <Br size="60"/>

    <Comments />
    <Br size="60"/>

    <div class="full-container">
        <Footer/>
    </div>
    <Br size="70"/>
</section>
