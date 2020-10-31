<script>
    import { stores } from "@sapper/app";
    import { onMount } from "svelte";
    import { API } from "@services";
    import { safeGet } from "@utils";
    import { 
        Br, 
        Icon, 
        Footer, 
        Button, 
        EditArea, 
        LazyToggle,
    } from '@components'
    import {
        Share,
        Trust,
        Comments,
        FundList,
        Donators,
        LastNews,
        InteractionIndicators,
    } from './components'
    import {
        MapView,
        AboutView,
        VideosView,
        ContactsView,
        DocumentsView,
        DescriptionView,
        OrganizationButtonView,
    } from './view'
    import {
        MapEdit,
        AboutEdit,
        VideosEdit,
        ContactsEdit,
        DocumentsEdit,
        DescriptionEdit,
        OrganizationButtonEdit,
    } from './edit'

    const { page } = stores();

    // Organization
    let organizationId = $page.params.id;
    let isNew = organizationId === 'new'

    let isEditMode = isNew
    let isEdit = {
        topInfo: false,
        description: false,
        about: false,
        documents: false,
        videos: false,
        contacts: false,
        map: false,
    }

    // Entities
    let funds
    let articles
    let donators
    let comments
    let organization
    
    $: organizationBlock = {
        id: safeGet(() => organization._id),
        name: safeGet(() => organization.name),
        avatar: safeGet(() => organization.avatar),
    };
    $: carouselTop = safeGet(() => organization.photos.map(p => ({ src: p, alt: 'Фото організації' })));
    $: descriptionShort = {
        name: safeGet(() => organization.name) || null,
        subtitle: safeGet(() => organization.description) || null,
        description: safeGet(() => organization.content) || null,
    };
    $: animalFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f._id,
        src: f.avatar,
        title: f.title,
        total: f.needed_sum,
        current: f.current_sum,
        city: f.location.city,
    })))
    $: othersFunds = safeGet(() => funds.filter(f => f.type !== 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f._id,
        src: f.avatar,
        title: f.title,
        total: f.needed_sum,
        current: f.current_sum,
        city: f.location.city,
    })))
    $: iconsLine = {
        likes: safeGet(() => organization.likes),
        isLiked: safeGet(() => organization.is_liked),
        views: safeGet(() => organization.views),
    };
    $: descriptionBlock = {
        title: safeGet(() => organization.description),
        text: safeGet(() => organization.content),
    };
    $: contacts = safeGet(() => organization.contacts.map(c => ({
        title: c.title,
        href: c.value,
        type: c.type,
    })), []. true)
    $: donatorsData = safeGet(() => donators.map(d => ({
        id: d._id,
        src: d.avatar,
        subtitle: d.name,
        title: `${d.amount} грн`,
        checked: d.checked,
    })));
    $: lastNews = safeGet(() => articles.map(n => ({
        id: n._id,
        src: n.src,
        likes: n.likes,
        isLiked: n.is_liked,
        title: n.title,
        subtitle: n.subtitle,
        created_at: n.created_at,
    })).slice(0, 3));
    $: documents = safeGet(() => organization.documents.map(d => ({ src: d, alt: 'Документи організації' })));
    $: media = safeGet(() => organization.videos.map(d => ({ src: d, alt: 'Відео організації' })), [], true);
    $: location = {
        map: safeGet(() => organization.location.map),
        virtual_tour: safeGet(() => organization.tour),
    };
    $: commentsData = {
        comments: safeGet(() => comments.map(c => ({
            likes: c.likes,
            avatar: c.avatar,
            author: c.name,
            comment: c.content,
            checked: c.checked,
            created_at: c.created_at,
        }))),
    };

    onMount(async () => {
        if (isNew) return
        organization = await API.getOrganization(organizationId).catch(() => null)
        donators = await API.getDonatorsByOrg(organizationId).catch(() => null)
        comments = await API.getCommentsByOrg(organizationId).catch(() => null)
        funds = await API.getFundsByOrg(organizationId).catch(() => null)
    });

    async function onSubmit(section, values) {
        isEdit[section] = false
        console.log(values)
    }

    function onCancel(section) {
        isEdit[section] = false
    }

    function onToggleMode() {
        isEditMode = !isEditMode
        if (!isEditMode) {
            isEdit = {
                topInfo: false,
                description: false,
                about: false,
                documents: false,
                videos: false,
                contacts: false,
                map: false,
            }
        }
    }
</script>

<svelte:head>
    <title>Charitify - Organization page.</title>
</svelte:head>

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

    <!-- Top organization info -->
    <LazyToggle active={isEdit.topInfo}>
        <OrganizationButtonEdit 
            data={organizationBlock}
            submit={onSubmit.bind(null, 'topInfo')} 
            on:cancel={onCancel.bind(null, 'topInfo')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.topInfo} mounted class="full-container">
        <EditArea on:click={() => isEdit.topInfo = !isEdit.topInfo} off={!isEditMode}>    
            <Br size="30"/>
            <OrganizationButtonView organization={organizationBlock}/>
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="50" />
    {/if}
    <!-- END: Top organization info -->

    <Br size="20" />
    
    <!-- Description -->
    <LazyToggle active={isEdit.description}>
        <DescriptionEdit 
            data={{ ...descriptionShort, avatars: carouselTop }}
            submit={onSubmit.bind(null, 'description')} 
            on:cancel={onCancel.bind(null, 'description')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.description} mounted class="full-container">
        <EditArea on:click={() => isEdit.description = !isEdit.description} off={!isEditMode}>
            {#if isEditMode}
                <Br size="30" />
            {/if}  
            <DescriptionView 
                {carouselTop}
                title={descriptionShort.name} 
                text={descriptionShort.subtitle}
            />
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="30" />
    {/if}
    <!-- END: Description -->

    <Br size="10" />
    <LazyToggle active={!isEditMode} mounted>
        <InteractionIndicators 
            likes={iconsLine.likes} 
            views={iconsLine.views} 
            isLiked={iconsLine.isLiked}
        />
        <Br size="50"/>
        <FundList title="Фонди тварин" items={animalFunds}/>
        <Br size="45" />
        <FundList title="Інші фонди" items={othersFunds}/>
    </LazyToggle>
    <Br size="30" />
    
    <!-- About -->
    <LazyToggle active={isEdit.about}>
        <AboutEdit 
            data={descriptionShort}
            submit={onSubmit.bind(null, 'about')} 
            on:cancel={onCancel.bind(null, 'about')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.about} mounted class="full-container">
        <EditArea on:click={() => isEdit.about = !isEdit.about} off={!isEditMode}>    
            <Br size="30"/>
            <AboutView
                title="Про нас"
                text={descriptionShort.description}
            />
        </EditArea>
    </LazyToggle>
    <!-- END: About -->

    <Br size="10" />
    <LazyToggle active={!isEditMode} mounted>
        <Share />
        <Br size="50" />
        <Trust active={iconsLine.isLiked}/>
        <Br size="50" />
        <Donators items={donatorsData}/>
        <Br size="60" />
        <LastNews 
            items={lastNews} 
            carousel={carouselTop}
            iconsLine={iconsLine}
            organization={organization}
            descriptionShort={descriptionShort}
        />
    </LazyToggle>
    <Br size="60" />

    <!-- Documents -->
    <LazyToggle active={isEdit.documents}>
        <DocumentsEdit 
            data={{ documents }}
            submit={onSubmit.bind(null, 'documents')} 
            on:cancel={onCancel.bind(null, 'documents')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.documents} mounted class="full-container">
        <EditArea on:click={() => isEdit.documents = !isEdit.documents} off={!isEditMode}>    
            <Br size="30"/>
            <DocumentsView items={documents}/>
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="30" />
    {/if}
    <!-- END: Documents -->
    
    <Br size="40" />

    <!-- Videos -->
    <LazyToggle active={isEdit.videos}>
        <VideosEdit 
            data={{ videos: media }}
            submit={onSubmit.bind(null, 'videos')}
            on:cancel={onCancel.bind(null, 'videos')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.videos} mounted class="full-container">
        <EditArea on:click={() => isEdit.videos = !isEdit.videos} off={!isEditMode}>    
            <Br size="15"/>
            <VideosView items={media}/>
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="30" />
    {/if}
    <!-- END: Videos -->
    
    <Br size="40" />

    <!-- Contacts -->
    <LazyToggle active={isEdit.contacts}>
        <ContactsEdit 
            data={{ ...organizationBlock, contacts }}
            submit={onSubmit.bind(null, 'contacts')}
            on:cancel={onCancel.bind(null, 'contacts')}
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.contacts} mounted class="full-container">
        <EditArea on:click={() => isEdit.contacts = !isEdit.contacts} off={!isEditMode}>
            <Br size="30"/>
            <ContactsView {contacts} {organization}/>
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="10" />
    {/if}
    <!-- END: Contacts -->

    <Br size="60" />

    <!-- Map -->
    <LazyToggle active={isEdit.map}>
        <MapEdit 
            data={{ location }}
            submit={onSubmit.bind(null, 'map')} 
            on:cancel={onCancel.bind(null, 'map')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.map} mounted class="full-container">
        <EditArea on:click={() => isEdit.map = !isEdit.map} off={!isEditMode}>    
            <Br size="15"/>
            <MapView {location} preview={isEditMode}/>
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="10" />
    {/if}
    <!-- END: Map -->
    
    <Br size="60" />

    <LazyToggle active={!isEditMode} mounted>
        <Comments items={commentsData.comments}/>
        <Br size="40" />
    </LazyToggle>

    <div class="full-container">
        <Footer />
    </div>
</section>
