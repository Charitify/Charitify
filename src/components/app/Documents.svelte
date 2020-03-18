<script>
    import Card from '../Card.svelte'
    import Picture from '../Picture.svelte'
    import Carousel from '../Carousel.svelte'

    const cardSample = {
        src: 'https://placeimg.com/300/300/people',
        alt: '10грн',
    }

    const all = new Array(5).fill(cardSample)
</script>

<Carousel items={all} size="auto" dots={false} let:item={item} let:index={index}>
    <div class={!index ? 'start' : index === all.length - 1 ? 'end' : ''}>
        <Card class="flex">
            <Picture {...item} size="contain"/>
        </Card>
    </div>
</Carousel>

<style>
    div {
        flex: none;
        display: flex;
        align-self: stretch;
        height: 180px;
        width: 126px;
        padding: 0 5px;
        box-sizing: content-box;
    }

    div.start {
        padding-left: var(--screen-padding);
    }

    div.end {
        padding-right: var(--screen-padding);
    }
</style>
