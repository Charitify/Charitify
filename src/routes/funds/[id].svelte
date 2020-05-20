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
        Trust,
        Share,
        Comments,
        Donators,
        InteractionIndicators,
    } from './components'
    import { 
        VideosView,
        TopInfoView,
        DocumentsView,
        HowToHelpView,
        AnimalCardView,
        DescriptionView,
    } from './view'
    import { 
        VideosEdit,
        TopInfoEdit,
        DocumentsEdit,
        HowToHelpEdit,
        AnimalCardEdit,
        DescriptionEdit,
    } from './edit'

    const { page } = stores()

    let charityId = $page.params.id
    let isEditMode = false
    let isEdit = {
        topInfo: false,
        description: false,
        videos: false,
        documents: false,
        howToHelp: false,
        animalCard: false,
    }

    // Entities
    let charity
    let comments
    
    $: carouselTop = safeGet(() => charity.avatars.map((a, i) => ({ src: a.src, srcBig: a.src2x, alt: a.title })));
    $: organization = safeGet(() => charity.organization, {});
    $: cardTop = safeGet(() => ({
        title: charity.title,
        subtitle: charity.subtitle,
        current_sum: charity.curremt_sum,
        need_sum: charity.need_sum,
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
        description: safeGet(() => charity.description),
    };
    $: animal = safeGet(() => ({
        avatar: charity.animal.avatars[0].src,
        name: charity.animal.name,
        breed: charity.animal.breed,
        birth: charity.animal.birth,
        age: (new Date().getFullYear()) - (new Date(charity.animal.birth).getFullYear()),
        sex: charity.animal.sex,
        sterilization: charity.animal.sterilization,
        character: charity.animal.character,
        character_short: charity.animal.character_short,
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
        await delay(15000)
        charity = await API.getFund(1)
        comments = await API.getComments()
    })

    async function onSubmit(section, values) {
        isEdit[section] = false
        console.log(values)
    }

    function onToggleMode() {
        isEditMode = !isEditMode
        if (!isEditMode) {
            isEdit = {
                topInfo: false,
                description: false,
                videos: false,
                documents: false,
                howToHelp: false,
                animalCard: false,
            }
        }
    }
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<DonationButton/>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>

    <div>
        <Br size="30"/>
        <Button size="small" is="info" on:click={onToggleMode}>
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
    <LazyToggle active={isEdit.topInfo}>
        <Br size="30"/>
        <TopInfoEdit submit={onSubmit.bind(null, 'topInfo')} data={{ ...cardTop, organization, photos: carouselTop }}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.topInfo} mounted class="full-container">
        <EditArea on:click={() => isEdit.topInfo = !isEdit.topInfo} off={!isEditMode}>    
            <Br size="30"/>
            <TopInfoView {cardTop} {carouselTop} {organization}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Top info -->

    <Br size="20"/>
    <LazyToggle active={!isEditMode} mounted>
        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views}/>
    </LazyToggle>
    <Br size="50"/>

    <!-- Description -->
    <LazyToggle active={isEdit.description}>
        <DescriptionEdit submit={onSubmit.bind(null, 'description')} data={descriptionBlock}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.description} mounted class="full-container">
        <EditArea on:click={() => isEdit.description = !isEdit.description} off={!isEditMode}>    
            <Br size="30"/>
            <DescriptionView title={descriptionBlock.title} text={descriptionBlock.description}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Description -->

    <Br size="10"/>
    <LazyToggle active={!isEditMode} mounted>
        <Share />
        <Br size="45"/>
        <Trust active={trust.isLiked}/>
    </LazyToggle>
    <Br size="60"/>

    <!-- Animal -->
    <LazyToggle active={isEdit.animalCard}>
        <AnimalCardEdit submit={onSubmit.bind(null, 'animalCard')} data={animal}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.animalCard} mounted class="full-container">
        <EditArea on:click={() => isEdit.animalCard = !isEdit.animalCard} off={!isEditMode}>    
            <Br size="30"/>
            <AnimalCardView {animal}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Animal -->

    <Br size="60"/>
    <LazyToggle active={!isEditMode} mounted>
        <Donators items={donators}/>
        <Br size="60"/>
    </LazyToggle>

    <!-- Documents -->
    <LazyToggle active={isEdit.documents}>
        <DocumentsEdit submit={onSubmit.bind(null, 'documents')} data={documents}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.documents} mounted class="full-container">
        <EditArea on:click={() => isEdit.documents = !isEdit.documents} off={!isEditMode}>    
            <Br size="30"/>
            <DocumentsView items={documents}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Documents -->
    
    <Br size="60"/> 
    
    <!-- Videos -->
    <LazyToggle active={isEdit.videos}>
        <VideosEdit submit={onSubmit.bind(null, 'videos')} data={media}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.videos} mounted class="full-container">
        <EditArea on:click={() => isEdit.videos = !isEdit.videos} off={!isEditMode}>    
            <Br size="30"/>
            <VideosView items={media}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Videos -->
    
    <Br size="60"/>

    <!-- How to help -->
    <LazyToggle active={isEdit.howToHelp}>
        <HowToHelpEdit submit={onSubmit.bind(null, 'howToHelp')} data={howToHelp}/>
    </LazyToggle>
    <LazyToggle active={!isEdit.howToHelp} mounted class="full-container">
        <EditArea on:click={() => isEdit.howToHelp = !isEdit.howToHelp} off={!isEditMode}>    
            <Br size="30"/>
            <HowToHelpView data={howToHelp}/>
        </EditArea>
    </LazyToggle>
    <!-- END: How to help -->

    <Br size="60"/>
    <LazyToggle active={!isEditMode} mounted>
        <Comments items={commentsData.comments}/>
        <Br size="60"/>
    </LazyToggle>

    <div class="full-container">
        <Footer/>
    </div>
    <Br size="70"/>
</section>
