<script>
    import { modals } from '@store'
    import { Br, NewsList, Modal, FancyBox, Carousel } from '@components'
    import TopCarousel from './_TopCarousel.svelte'

    export let items = []
    export let carousel = []

    let modalActive = false

    function onClick(e) {
        modals.update(s => ({ ...s, ['modal-last-news']: { open: true, id: e.detail.item.id } }))
    }

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }
</script>

<h1>Останні новини</h1>
<Br size="20" />
<NewsList {items} on:click={onClick}/>

<Modal 
    id="last-news" 
    size="full"
    let:props={props} 
    swipe="left right" 
    startPosition={{ x: 300, y: 0 }}
>
    something {props.id}

    <Br/>

    <div class="container">
        <section class="flex" style="height: 240px">
            <FancyBox blockBody={false}>
                <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false}/>
                <section slot="box" class="flex full-width">
                    <Carousel items={carousel} {...propsBox}/>
                </section>
            </FancyBox>
        </section>
    </div>
</Modal>