<script>
    import { Br, FancyBox, Carousel } from '@components'

    export let items
</script>

<h1>Відео про нас</h1>
<Br size="20" />
<section class="flex" style="height: 240px">
    <FancyBox>
        <Carousel items={items} />
    </FancyBox>
</section>