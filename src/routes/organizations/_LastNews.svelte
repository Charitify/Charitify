<script>
    import { onMount } from 'svelte'
    import { modals } from '@store'
    import { bodyScroll, safeGet } from '@utils'
    import { Br, NewsList, Modal, FancyBox, Carousel, Loader } from '@components'
    import TopCarousel from './_TopCarousel.svelte'
    import Trust from './_Trust.svelte'
    import DescriptionShort from './_DescriptionShort.svelte'
    import InteractionIndicators from './_InteractionIndicators.svelte'
    
    export let items
    export let carousel = []
    export let iconsLine = {}
    export let organization = {}
    export let descriptionShort = {}

    function onClick(open, e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open, id: safeGet(() => e.detail.item.id) } }))
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick.bind(null, true)}/>

<Modal id="last-news" size="full" swipe="all">
    <section class="container flex flex-column relative">
        <Br/>

        {#if descriptionShort.title !== null}
            <h1>{ descriptionShort.title }</h1>
        {:else}
            <Loader type="h1"/>
        {/if}
        <Br size="5"/>
        {#if descriptionShort.title !== null}
            <p>{ descriptionShort.title }</p>
        {:else}
            <div style="width: 40%"><Loader type="p"/></div>
        {/if}
        <Br size="25"/>
        
        <section class="flex" style="height: 240px">
            <Carousel items={carousel} stopPropagation={true}/>
        </section>

        <Br size="25"/>
        <DescriptionShort text={descriptionShort.text} title={descriptionShort.title}/>
        <Br size="10" />

        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views} isLiked={organization.isLiked}/>
        <Br size="50" />

        <Trust active={organization.isLiked}/>

        <Br/>
    </section>
</Modal>

<style>
</style>