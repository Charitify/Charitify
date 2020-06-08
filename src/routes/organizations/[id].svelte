<script>
    import { stores } from "@sapper/app";
    import { onMount } from "svelte";
    import { API } from "@services";
    import { delay, safeGet } from "@utils";
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
    let isEditMode = false
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
    let organization = {};
    let comments
    let funds
    
    $: organizationBlock = {
        id: organization.id,
        name: organization.name,
        avatar: organization.avatar,
        avatarBig: organization.avatarBig,
    };
    $: carouselTop = (organization.avatars || []).map((a, i) => ({ src: a.src, srcBig: a.src2x, alt: a.title }));
    $: descriptionShort = {
        name: organization.name || null,
        subtitle: organization.subtitle || null,
        description: organization.description || null,
    };
    $: animalFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.curremt_sum,
        currency: f.currency,
        city: f.location.city,
    })))
    $: othersFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.curremt_sum,
        currency: f.currency,
        city: f.location.city,
    })))
    $: iconsLine = {
        likes: organization.likes,
        isLiked: organization.is_liked,
        views: organization.views,
    };
    $: descriptionBlock = {
        title: organization.title,
        text: organization.description,
    };
    $: contacts = safeGet(() => organization.contacts.map(c => ({
        title: c.title,
        href: c.value,
        type: c.type,
    })), []. true)
    $: donators = safeGet(() => organization.donators.map(d => ({
        id: d.id,
        src: d.avatar,
        title: `${d.currency} ${d.amount}`,
        subtitle: d.name,
        checked: d.checked,
    })));
    $: lastNews = safeGet(() => organization.news.map(n => ({
        id: n.id,
        src: n.src,
        likes: n.likes,
        isLiked: n.is_liked,
        title: n.title,
        subtitle: n.subtitle,
        created_at: n.created_at,
    })).slice(0, 3));
    $: documents = safeGet(() => organization.documents.map(d => ({
        id: d.id,
        alt: d.title,
        src: d.src,
        src2x: d.src2x,
    })));
    $: media = safeGet(() => organization.media.map(d => ({
        id: d.id,
        alt: d.title,
        src: d.src,
        srcBig: d.src2x,
        description: d.description,
    })), [], true);
    $: location = {
        map: safeGet(() => organization.location.map),
        virtual_tour: safeGet(() => organization.location.virtual_tour),
    };
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
        organization = await API.getOrganization(organizationId);
        comments = await API.getComments()
        funds = await API.getFunds()
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
        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views} isLiked={organization.isLiked}/>
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
        <Trust active={organization.isLiked}/>
        <Br size="50" />
        <Donators items={donators}/>
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
