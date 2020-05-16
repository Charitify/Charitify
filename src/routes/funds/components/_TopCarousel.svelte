<script>
    import { Carousel } from '@components'

    export let items = []
</script>

<section class="flex" style="height: 240px">
    <Carousel items={items} dotsBelow={false}/>
</section>