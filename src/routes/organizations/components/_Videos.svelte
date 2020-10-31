<script>
    import { Br, Carousel } from '@components'

    export let items
</script>

<h1>Відео про нас</h1>
<Br size="20" />
<section class="flex" style="height: 240px">
    <Carousel items={items} let:item={item}>
        <iframe 
            src={item}
            title="media"
            width="100%" 
            height="100%" 
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
        />
    </Carousel>
</section>
