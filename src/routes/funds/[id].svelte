<script>
    import { onMount } from "svelte";
    import { stores } from '@sapper/app'
    import { API } from '@services'
    import { organization, fund, pet, donators, comments } from '@store'
    import { safeGet, _ } from '@utils'
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

    let mounted = false
    onMount(() => mounted = true)
    
    $: fund_id = $page.params.id
    $: isNew = fund_id === 'new'

    $: if (!isNew && mounted) fetchData(fund_id)

    let allValues = {}

    $: isEditMode = isNew
    $: isEdit = {
        topInfo: isNew,
        description: isNew,
        videos: isNew,
        documents: isNew,
        howToHelp: isNew,
        animalCard: isNew,
    }

    $: carouselTop = safeGet(() => $fund.photos.map(p => ({ src: p, alt: 'Фото фонду' })));
    $: organizationData = $organization || {};
    $: cardTop = safeGet(() => ({
        name: $fund.name,
        description: $fund.description,
        current_sum: $fund.current_sum,
        needed_sum: $fund.needed_sum,
    }));
    $: iconsLine = {
        likes: safeGet(() => $fund.likes),
        views: safeGet(() => $fund.views),
    };
    $: trust = {
        isLiked: safeGet(() => $fund.is_liked),
    };
    $: descriptionBlock = {
        description: safeGet(() => $fund.content),
    };
    $: animalData = {
        id: safeGet(() => $pet._id),
        avatar: safeGet(() => $pet.avatar),
        name: safeGet(() => $pet.name),
        breed: safeGet(() => $pet.breed),
        birth: safeGet(() => $pet.birth),
        age: safeGet(() => (new Date().getFullYear()) - (new Date($pet.birth).getFullYear())),
        sex: safeGet(() => $pet.sex),
        sterilization: safeGet(() => $pet.sterilization),
        character: safeGet(() => $pet.character),
        lifestory: safeGet(() => $pet.story.map(l => ({ ...l, date: new Date(l.date).toLocaleDateString() }))),
        vaccination: safeGet(() => $pet.vaccines),
    };
    $: donatorsData = safeGet(() => $donators.map(d => ({
        id: d._id,
        src: d.avatar,
        subtitle: d.name,
        title: `${d.amount} грн`,
    })));
    $: documents = safeGet(() => $fund.documents.map(d => ({ src: d, title: 'Докуменди фонду' })));
    $: media = safeGet(() => $fund.videos.map(v => ({ src: v, alt: 'Відео фонду' })), [], true);
    $: howToHelp = safeGet(() => ({
        phone: $fund.phone,
        how_to_help: $fund.how_to_help,
    }));
    $: commentsData = {
        comments: safeGet(() => $comments.map(c => ({
            id: c._id,
            likes: c.likes,
            avatar: c.avatar,
            author: c.name,
            comment: c.content,
            checked: c.is_liked,
            created_at: c.created_at,
        }))),
    };

    async function fetchData () {
        Promise.all([
            API.getFund(fund_id).catch(() => null),
            API.getPetsByFund(fund_id).catch(() => null),
            API.getDonatorsByFund(fund_id).catch(() => null),
            API.getCommentsByFund(fund_id).catch(() => null),
            API.getOrganizationByFund(fund_id).catch(() => null),
        ]).then(res => {
            fund.set(res[0] || null)
            pet.set(safeGet(() => res[1][0]) || null)
            donators.set(res[2] || null)
            comments.set(res[3] || null)
            organization.set(res[4] || null)
        })
    }

    async function onSubmit(section, values) {
        isEdit[section] = false
        console.log(values)
    }

    function onCancel(section) {
        isEdit[section] = false
    }

    function onChange(e) {
        allValues = { ...allValues, ...e.detail.values }
    }

    function onToggleMode() {
        isEditMode = !isEditMode
        if (!isEditMode) {
            console.log(allValues)
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

    <div class="overflow-hidden">
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
        <Br size="30"/>
    </div>

    <!-- Top info -->
    <LazyToggle active={isEdit.topInfo}>
        <Br size="30"/>
        <TopInfoEdit 
            data={{ ...cardTop, organization: organizationData, photos: carouselTop }}
            submit={onSubmit.bind(null, 'topInfo')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'topInfo')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.topInfo} mounted class="full-container">
        <EditArea on:click={() => isEdit.topInfo = !isEdit.topInfo} off={!isEditMode}>    
            <Br size="30"/>
            <TopInfoView {cardTop} {carouselTop} organization={organizationData}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Top info -->

    <LazyToggle active={!isEditMode} mounted>
        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views}/>
    </LazyToggle>
    <Br size="50"/>

    <!-- Description -->
    <LazyToggle active={isEdit.description}>
        <DescriptionEdit 
            data={descriptionBlock}
            submit={onSubmit.bind(null, 'description')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'description')} 
        />
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
        <AnimalCardEdit
            data={animalData}
            submit={onSubmit.bind(null, 'animalCard')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'animalCard')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.animalCard} mounted class="full-container">
        <EditArea on:click={() => isEdit.animalCard = !isEdit.animalCard} off={!isEditMode}>    
            <Br size="30"/>
            <AnimalCardView animal={animalData}/>
        </EditArea>
    </LazyToggle>
    <!-- END: Animal -->

    <Br size="60"/>
    <LazyToggle active={!isEditMode} mounted>
        <Donators items={donatorsData}/>
        <Br size="60"/>
    </LazyToggle>

    <!-- Documents -->
    <LazyToggle active={isEdit.documents}>
        <DocumentsEdit
            data={{ documents }}
            submit={onSubmit.bind(null, 'documents')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'documents')} 
        />
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
        <VideosEdit 
            data={{ videos: media }}
            submit={onSubmit.bind(null, 'videos')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'videos')} 
        />
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
        <HowToHelpEdit 
            data={howToHelp}
            submit={onSubmit.bind(null, 'howToHelp')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'howToHelp')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.howToHelp} mounted class="full-container">
        <EditArea on:click={() => isEdit.howToHelp = !isEdit.howToHelp} off={!isEditMode}>    
            <Br size="30"/>
            <HowToHelpView data={howToHelp}/>
        </EditArea>
    </LazyToggle>
    <!-- END: How to help -->

    <Br size="60"/>

    <!--
    <LazyToggle active={!isEditMode} mounted>
        <Comments items={commentsData.comments}/>
        <Br size="60"/>
    </LazyToggle>
    -->

    <div class="full-container">
        <Footer/>
    </div>
    <Br size="70"/>
</section>
