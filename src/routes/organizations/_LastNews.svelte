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

    function onClick(open, e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open, id: safeGet(() => e.detail.item.id) } }))
    }

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }

    $: modalActive = safeGet(() => $modals['modal-last-news'].open)

    let screenY = 0
    let currentScroll = 0
    function synteticScroll(el) {
        el.ontouchstart = function(e) {
            screenY = e.touches[0].screenY
            currentScroll = el.scrollTop
        }
        el.ontouchend = function(e) {
            screenY = 0
            currentScroll = 0
        }
        el.ontouchmove = function(e) {
            let deltaY = screenY - e.touches[0].screenY
            e.preventDefault()
            e.stopPropagation()

            el.scrollTop = currentScroll + deltaY

            console.log(el.scrollTop)
        }
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick.bind(null, true)}/>

<Modal
    bind:ref={modal}
    id="last-news" 
    size="full"
    swipe="left right" 
    startPosition={{ x: 300, y: 0 }}
>
    <header class="flex flex-align-center flex-justify-between" style="background-color: rgb(var(--color-info)); transition: .1s">
        <h2 style="padding: 15px 20px">Закрити</h2>
        <button type="button" on:click={onClick.bind(null, false)} class="close">&#10005;</button>
    </header>

    <section use:synteticScroll class="container scroll-box scroll-y-center" style="flex: 1 1 auto; max-height: 100%">
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