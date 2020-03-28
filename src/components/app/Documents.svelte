<script>
    import Card from '@components/Card.svelte'
    import Picture from '@components/Picture.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Carousel from '@components/Carousel.svelte'

    const cardSample = {
        src: 'https://placeimg.com/300/300/people',
        alt: '10грн',
    }

    const all = new Array(5).fill(cardSample)
</script>

<Carousel items={all} size="auto" dots={false} let:item={item} let:index={index}>
    <div class={!index ? 'start' : index === all.length - 1 ? 'end' : ''}>
        <FancyBox>
            <Card class="flex">
                <Picture {...item} size="contain"/>
            </Card>
        </FancyBox>
    </div>
</Carousel>

<style>
    div {
        flex: none;
        display: flex;
        align-self: stretch;
        height: 180px;
        width: 126px;
        padding: 15px 5px;
        box-sizing: content-box;
    }

    div.start {
        padding-left: var(--screen-padding);
    }

    div.end {
        padding-right: var(--screen-padding);
    }
</style>
