<script>
    import { Swipe, SwipeItem } from '../plugins'
    import { Picture } from '../components'

    /**
     *
     * @type {{
     *     src: string,
     *     alt: string,
     *     onClick?: function,
     * }[]}
     */
    export let images = undefined

    $: imagesArr = [].concat(images).map(img => typeof img === 'string' ? { src: img } : img)
</script>

<section class="carousel">
    <Swipe>
        {#each imagesArr as img}
            <SwipeItem>
                <Picture src={img.src} alt={img.alt}/>
            </SwipeItem>
        {/each}
    </Swipe>
</section>

<style>
    .carousel {
        z-index: 0;
        flex-grow: 1;
        overflow: hidden;
        margin-bottom: 2px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-primary);
    }
</style>
