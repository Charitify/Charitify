<script>
    import { onMount } from 'svelte'
    import { modals } from '@store'
    import { bodyScroll, safeGet } from '@utils'
    import { Br, NewsList, Modal, FancyBox, Carousel } from '@components'
    import TopCarousel from './_TopCarousel.svelte'

    export let items = []
    export let carousel = []

    let modal = null
    let scroller = null

    function onClick(e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open: true, id: e.detail.item.id } }))
    }

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }

    $: modalActive = safeGet(() => $modals['modal-last-news'].open)
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick}/>

<Modal
    bind:ref={modal}
    id="last-news" 
    size="full"
    swipe="left right" 
    startPosition={{ x: 300, y: 0 }}
>
    <section class="container scroll-box scroll-y-center" style="flex: 1 1 auto; max-height: 100%">
        <Br/>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <br>
        <br>
        <br>
        <br>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <br>
        <br>
        <br>
        <br>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <br>
        <br>
        <br>
        <br>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <Br/>
    </section>
</Modal>