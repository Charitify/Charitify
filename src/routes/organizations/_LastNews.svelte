<script>
    import { onMount } from 'svelte'
    import { modals } from '@store'
    import { bodyScroll, safeGet, stopPropagationUntilEnd } from '@utils'
    import { Br, NewsList, Modal, FancyBox, Carousel } from '@components'
    import TopCarousel from './_TopCarousel.svelte'
    import Trust from './_Trust.svelte'
    import DescriptionShort from './_DescriptionShort.svelte'
    import InteractionIndicators from './_InteractionIndicators.svelte'
    
    export let items = []
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
    <header>
        <h2 style="padding: 15px 20px">Закрити</h2>
        <button type="button" on:click={onClick.bind(null, false)} class="close">&#10005;</button>
    </header>

    <Br size="60"/>

    <section class="container flex flex-column relative">
        <Br/>

        <h1>{ descriptionShort.title }</h1>
        <Br size="5"/>
        <p>{ descriptionShort.title }</p>
        <Br size="25"/>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <Carousel items={carousel}/>
        </section>

        <DescriptionShort text={descriptionShort.text}/>
        <Br size="10" />

        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views} isLiked={organization.isLiked}/>
        <Br size="50" />

        <Trust active={organization.isLiked}/>

        <Br/>

        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <Carousel items={carousel}/>
        </section>

        <DescriptionShort text={descriptionShort.text}/>
        <Br size="10" />

        <InteractionIndicators likes={iconsLine.likes} views={iconsLine.views} isLiked={organization.isLiked}/>
        <Br size="50" />

        <Trust active={organization.isLiked}/>

        <Br/>
    </section>
</Modal>

<style>
    header {
        z-index: 1;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgb(var(--color-white));
        background-color: rgb(var(--color-info));
    }

    button.close {
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
    }
</style>