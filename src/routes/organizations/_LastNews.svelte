<script>
    import { onMount } from 'svelte'
    import { modals } from '@store'
    import { bodyScroll, safeGet } from '@utils'
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

    function scrollUntilEnd(el) {
        el.ontouchstart = controllScroll
        el.ontouchmove = controllScroll
        el.ontouchend = controllScroll

        function getScrollPercent(container, child) {
            const h = container
            const b = child
            const st = 'scrollTop'
            const sh = 'scrollHeight'
            return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100
        }

        function controllScroll(e) {
            const scroll = getScrollPercent(el, el.children[0])
            if (scroll >= 0 && scroll <= 100) {
                e.stopPropagation()
            }
        }
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick.bind(null, true)}/>

<Modal
    id="last-news" 
    size="full"
    swipe="all"
>
    <header
        class="flex flex-align-center flex-justify-between"
        style="background-color: rgb(var(--color-info)); transition: .1s; color: rgb(var(--color-white))"
    >
        <h2 style="padding: 15px 20px">Закрити</h2>
        <button type="button" on:click={onClick.bind(null, false)} class="close">&#10005;</button>
    </header>

    <section 
        class="container scroll-box scroll-y-center flex flex-column"
        style="flex: 1 1 auto; max-height: 100%"
        use:scrollUntilEnd
    >
        <div class="flex-1">
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
        </div>
    </section>
</Modal>

<style>
    button.close {
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
    }
</style>