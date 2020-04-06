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
    $: onTriggerModal(modalActive)

    function onFancyClose() {
        bodyScroll.disableScroll(modal)
    }

    function onTriggerModal() {
        if (modalActive) {
            document.body.addEventListener('touchmove', preventScroll, { passive: false })
        } else {
            document.body.removeEventListener('touchmove', preventScroll, { passive: false })
        }
    }

    function preventScroll(evt) {
        //In this case, the default behavior is scrolling the body, which
        //would result in an overflow.  Since we don't want that, we preventDefault.
        if(!evt._isScroller) {
            evt.preventDefault()
        }
    }
       
    $: stopScrollOverflow(scroller)

    function stopScrollOverflow(el) {
        if (!el) return
        el.addEventListener('touchstart', function() {
        const top = el.scrollTop
        const totalScroll = el.scrollHeight
        const currentScroll = top + el.offsetHeight
    
        //If we're at the top or the bottom of the containers
        //scroll, push up or down one pixel.
        //
        //this prevents the scroll from "passing through" to
        //the body.
        if(top === 0) {
            el.scrollTop = 1
        } else if(currentScroll === totalScroll) {
            el.scrollTop = top - 1
        }
        })
    
        el.addEventListener('touchmove', function(evt) {
        //if the content is actually scrollable, i.e. the content is long enough
        //that scrolling can occur
        if(el.offsetHeight < el.scrollHeight)
            evt._isScroller = true
        })
    }
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
    <section bind:this={scroller} class="container scroll-box scroll-y-center" style="flex: 1 1 auto; max-height: 100%">
        <Br/>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox on:close={onFancyClose}>
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
            <FancyBox on:close={onFancyClose}>
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
            <FancyBox on:close={onFancyClose}>
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
            <FancyBox on:close={onFancyClose}>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <Br/>
    </section>
</Modal>