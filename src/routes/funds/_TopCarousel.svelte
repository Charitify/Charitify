<script>
    import { FancyBox, Carousel } from '@components'

    export let items = []

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }
</script>

<section class="flex" style="height: 240px">
    <FancyBox>
        <Carousel items={items} on:click={onCarouselClick} dotsBelow={false}/>
        <section slot="box" class="flex full-width">
            <Carousel items={items} {...propsBox}/>
        </section>
    </FancyBox>
</section>