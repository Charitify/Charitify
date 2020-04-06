<script>
    import { modals } from '@store'
    import { bodyScroll } from '@utils'
    import { Br, NewsList, Modal, FancyBox, Carousel } from '@components'
    import TopCarousel from './_TopCarousel.svelte'

    export let items = []
    export let carousel = []

    let fancyRef
    let modalRef
    let isModalOpen = false
    let isFancyOpen = false

    function onClick(e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open: true, id: e.detail.item.id } }))
    }

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }

    function onToggleModal(open) {
        isModalOpen = open
        if (isModalOpen) {
            bodyScroll.disableScroll(modalRef)
        } else {
            bodyScroll.enableScroll(modalRef)
        }
    }
    function onToggleFancyBox(open) {
        isFancyOpen = open
        if (isFancyOpen) {
            bodyScroll.disableScroll(fancyRef)
        } else {
            bodyScroll.enableScroll(fancyRef)
            bodyScroll.disableScroll(modalRef)
        }
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick}/>

<Modal 
    bind:ref={modalRef}
    id="last-news" 
    size="full"
    swipe="left right" 
    blockBody={false}
    startPosition={{ x: 300, y: 0 }}
    on:open={() => onToggleModal(true)}
    on:close={() => onToggleModal(false)}
>
    <div class="container scroll-box scroll-y-center">
        <Br/>
        
        <section class="flex" style="height: 240px" on:touchmove={e => e.stopPropagation()}>
            <FancyBox
                bind:ref={fancyRef}
                blockBody={false}
                on:open={() => onToggleFancyBox(true)}
                on:close={() => onToggleFancyBox(false)}
            >
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
            <FancyBox 
                blockBody={false}
                on:open={() => onToggleFancyBox(true)}
                on:close={() => onToggleFancyBox(false)}
            >
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
            <FancyBox 
                blockBody={false}
                on:open={() => onToggleFancyBox(true)}
                on:close={() => onToggleFancyBox(false)}
            >
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
            <FancyBox 
                blockBody={false}
                on:open={() => onToggleFancyBox(true)}
                on:close={() => onToggleFancyBox(false)}
            >
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>

        <Br/>
    </div>
</Modal>