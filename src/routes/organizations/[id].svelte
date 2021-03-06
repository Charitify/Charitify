<script>
    import { onMount } from "svelte";
    import { stores } from "@sapper/app";
    import { API } from "@services";
    import { organization, funds, donators, comments, articles } from '@store'
    import { safeGet, setToFormValues } from "@utils";
    import { 
        Br, 
        Icon, 
        Footer, 
        EditArea, 
        LazyToggle,
        MainButton,
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

    let mounted = false
    onMount(() => mounted = true)

    // Organization
    $: organization_id = $page.params.id;
    $: isNew = organization_id === 'new'

    $: if (!isNew && mounted) fetchData(organization_id)

    let allValues = {}

    $: isEditMode = isNew
    $: isEdit = {
        topInfo: isNew,
        description: isNew,
        about: isNew,
        documents: isNew,
        videos: isNew,
        contacts: isNew,
        map: isNew,
    }

    $: organizationBlock = {
        name: safeGet(() => $organization.name),
        logo: safeGet(() => $organization.logo),
    };
    $: carouselTop = safeGet(() => $organization.photos.map(p => ({ src: p, alt: 'Фото організації' })));
    $: descriptionShort = {
        description: safeGet(() => $organization.description),
    };
    $: contentShort = {  
        content: safeGet(() => $organization.content),
    }
    $: animalFunds = safeGet(() => $funds.map(f => ({
        id: f._id,
        title: f.title,
        total: f.needed_sum,
        current: f.current_sum,
        city: safeGet(() => f.location.city),
        photos: safeGet(() => f.photos.map(p => ({ src: p, alt: 'Фото фонду' })), [], true),
    })))
    $: othersFunds = safeGet(() => $funds.map(f => ({
        id: f._id,
        title: f.title,
        total: f.needed_sum,
        current: f.current_sum,
        city: safeGet(() => f.location.city),
        photos: safeGet(() => f.photos.map(p => ({ src: p, alt: 'Фото фонду' })), [], true),
    })))
    $: iconsLine = {
        likes: safeGet(() => $organization.likes),
        isLiked: safeGet(() => $organization.is_liked),
        views: safeGet(() => $organization.views),
    };
    $: contacts = safeGet(() => ['phone', 'email', 'telegram', 'facebook', 'viber'].map(k => ({
        title: k,
        type: k,
        href: $organization[k],
    })), [], true)
    $: donatorsData = safeGet(() => $donators.map(d => ({
        id: d._id,
        src: d.avatar,
        subtitle: d.name,
        title: `${d.amount} грн`,
        checked: d.checked,
    })));
    $: lastNews = safeGet(() => $articles.map(n => ({
        id: n._id,
        src: safeGet(() => n.photos[0]),
        likes: n.likes,
        isLiked: n.is_liked,
        title: n.title,
        subtitle: n.content,
        created_at: n.created_at,
    })).slice(0, 3));
    $: documents = safeGet(() => $organization.documents.map(d => ({ src: d, alt: 'Документи організації' })));
    $: media = safeGet(() => $organization.videos.map(d => ({ src: d, alt: 'Відео організації' })), [], true);
    $: location = {
        map: safeGet(() => $organization.location.map),
        tour: safeGet(() => $organization.location.tour),
    };
    $: commentsData = {
        comments: safeGet(() => $comments.map(c => ({
            likes: c.likes,
            avatar: c.avatar,
            author: c.name,
            comment: c.content,
            checked: c.checked,
            created_at: c.created_at,
        }))),
    };

    async function fetchData () {
        Promise.all([
            API.getOrganization(organization_id).catch(() => null),
            API.getFundsByOrg(organization_id).catch(() => null),
            API.getDonatorsByOrg(organization_id).catch(() => null),
            API.getArticlesByOrg(organization_id).catch(() => null),
            API.getCommentsByOrg(organization_id).catch(() => null),
        ]).then(res => {
            organization.set(res[0] || null)
            funds.set(res[1] || null)
            donators.set(res[2] || null)
            articles.set(res[3] || null)
            comments.set(res[4] || null)
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
        allValues = setToFormValues(allValues, e.detail.values)
    }

    function onToggleMode() {
        isEditMode = !isEditMode
        if (!isEditMode) {
            API.postOrganization(allValues)
            console.log(allValues)
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
    <Br size="30"/>

    <MainButton is="info" on:click={onToggleMode}>
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            {isEditMode ? 'Зберегти' : 'Редагувати'}
            <s></s>
            <s></s>
            {#if !isEditMode}
                <Icon type="edit" size="big" is="light"/>
            {/if}
        </span>
    </MainButton>

    <!-- Top organization info -->
    <LazyToggle active={isEdit.topInfo}>
        <OrganizationButtonEdit 
            data={organizationBlock}
            submit={onSubmit.bind(null, 'topInfo')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'topInfo')} 
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.topInfo} mounted class="full-container">
        <EditArea on:click={() => isEdit.topInfo = !isEdit.topInfo} off={!isEditMode}>    
            <Br size="30"/>
            <OrganizationButtonView organization={organizationBlock}/>
            <Br size="20" />
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="50" />
    {/if}
    <!-- END: Top organization info -->
    
    <!-- Description -->
    <LazyToggle active={isEdit.description}>
        <DescriptionEdit 
            data={{ ...descriptionShort, photos: carouselTop }}
            submit={onSubmit.bind(null, 'description')}
            withButtons={!isNew}
            on:change={onChange}
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
                text={descriptionShort.description}
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
            data={contentShort}
            submit={onSubmit.bind(null, 'about')}
            withButtons={!isNew}
            on:change={onChange}
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
            withButtons={!isNew}
            on:change={onChange}
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
            data={{ ...organizationBlock, ...$organization }}
            submit={onSubmit.bind(null, 'contacts')}
            withButtons={!isNew}
            on:change={onChange}
            on:cancel={onCancel.bind(null, 'contacts')}
        />
    </LazyToggle>
    <LazyToggle active={!isEdit.contacts} mounted class="full-container">
        <EditArea on:click={() => isEdit.contacts = !isEdit.contacts} off={!isEditMode}>
            <Br size="30"/>
            <ContactsView {contacts} organization={$organization}/>
            <Br size="20" />
        </EditArea>
    </LazyToggle>
    {#if isEditMode}
        <Br size="30" />
    {/if}
    <!-- END: Contacts -->

    <Br size="40" />

    <!-- Map -->
    <LazyToggle active={isEdit.map}>
        <MapEdit 
            data={{ location }}
            submit={onSubmit.bind(null, 'map')}
            withButtons={!isNew}
            on:change={onChange}
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

    <!--
    <LazyToggle active={!isEditMode} mounted>
        <Comments items={commentsData.comments}/>
        <Br size="40" />
    </LazyToggle>
    -->

    <div class="full-container">
        <Footer />
    </div>
</section>
