<script>
    import { stores } from '@sapper/app'
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { delay, safeGet, _ } from '@utils'
    import { 
        Br, 
        Icon, 
        Footer, 
        Button, 
        EditArea, 
        LazyToggle,
        DonationButton,
    } from '@components'
    import {
        Media,
        Trust,
        Share,
        Comments,
        Donators,
        Documents,
        HowToHelp,
        AnimalCard,
        Description,
        InteractionIndicators,
    } from './components'
    import { 
        TopInfoView,
    } from './view'
    import { 
        TopInfoEdit,
    } from './edit'

    const { page } = stores()

    let charityId = $page.params.id
    let isEdit = false
    let isEditMode = false

    // Entities
    let charity
    let comments
    
    $: carouselTop = safeGet(() => charity.avatars.map((a, i) => ({ src: a.src, srcBig: a.src2x, alt: a.title })));
    $: organization = safeGet(() => charity.organization, {});
    $: cardTop = safeGet(() => ({
        title: charity.title,
        subtitle: charity.subtitle,
        currentSum: charity.curremt_sum,
        neededSum: charity.need_sum,
        currency: charity.currency,
    }));
    $: iconsLine = {
        likes: safeGet(() => charity.likes),
        views: safeGet(() => charity.views),
    };
    $: trust = {
        isLiked: safeGet(() => charity.is_liked),
    };
    $: descriptionBlock = {
        title: safeGet(() => charity.title),
        text: safeGet(() => charity.description),
    };
    $: animal = safeGet(() => ({
        avatar: charity.animal.avatars[0].src,
        name: charity.animal.name,
        breed: charity.animal.breed,
        age: (new Date().getFullYear()) - (new Date(charity.animal.birth).getFullYear()),
        sex: charity.animal.sex,
        sterilization: charity.animal.sterilization,
        character: charity.animal.character,
        characterShort: charity.animal.character_short,
        lifestory: charity.animal.lifestory.map(l => ({ ...l, date: new Date(l.date).toLocaleDateString() })),
        vaccination: charity.animal.vaccination,
    }));
    $: donators = safeGet(() => charity.donators.map(d => ({
        id: d.id,
        title: `${d.currency} ${d.amount}`,
        subtitle: d.name,
        src: d.avatar,
        src2x: d.avatar2x,
    })));
    $: documents = safeGet(() => charity.documents.map(d => ({
        id: d.id,
        title: d.title,
        src: d.src,
        src2x: d.src2x,
    })));
    $: media = safeGet(() => charity.media.map(d => ({
        id: d.id,
        alt: d.title,
        src: d.src,
        srcBig: d.src2x,
        description: d.description,
    })), [], true);
    $: howToHelp = safeGet(() => ({
        phone: charity.organization.phone,
    }));
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
        await delay(5000)
        charity = await API.getFund(1)
        comments = await API.getComments()
    })

    async function onSubmit(values) {
        isEdit = !isEdit
        console.log(values)
    }
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
</style>

<DonationButton/>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>

    <div>
        <Br size="30"/>
        <Button size="small" is="info" on:click={() => (isEditMode = !isEditMode, isEdit = false)}>
            <span class="h3 font-secondary font-w-500 flex flex-align-center">
                {isEditMode ? 'Зберегти' : 'Редагувати'}
                <s></s>
                <s></s>
                {#if !isEditMode}
                    <Icon type="edit" size="small" is="light"/>
                {/if}
            </span>
        </Button>
        <Br size="40"/>
    </div>

    <!-- Top info -->
    <LazyToggle active={isEdit}>
        <Br size="30"/>
        <TopInfoEdit submit={onSubmit}/>
    </LazyToggle>
    <LazyToggle active={!isEdit} mounted class="full-container">
        <EditArea on:click={() => isEdit = !isEdit} off={!isEditMode}>    
            <Br size="30"/>
            <TopInfoView {cardTop} {carouselTop} {organization}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Top info -->

    <Br size="20"/>
    <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views}/>
    <Br size="50"/>

    <Description title={descriptionBlock.title} text={descriptionBlock.text}/>
    <Br size="10"/>

    <Share />
    <Br size="45"/>

    <Trust active={trust.isLiked}/>
    <Br size="60"/>

    <AnimalCard animal={animal}/>
    <Br size="60"/>

    <Donators items={donators}/>
    <Br size="60"/>

    <Documents items={documents}/>
    <Br size="45"/> 

    <Media items={media}/>
    <Br size="60"/>

    <HowToHelp data={howToHelp}/>
    <Br size="60"/>

    <Comments items={commentsData.comments}/>
    <Br size="60"/>

    <div class="full-container">
        <Footer/>
    </div>
    <Br size="70"/>
</section>
