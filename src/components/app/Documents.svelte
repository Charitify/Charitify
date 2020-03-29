<script>
    import { classnames } from '@utils'
    import Card from '@components/Card.svelte'
    import Picture from '@components/Picture.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Carousel from '@components/Carousel.svelte'

    let active = false
    const cardSample = {
        src: 'https://placeimg.com/300/300/people',
        alt: '10грн',
    }

    const all = new Array(5).fill(cardSample)
</script>

<Carousel items={all} size="auto" dots={false} let:item={item} let:index={index} class={classnames('documents', { active })}>
    <div class={!index ? 'start' : index === all.length - 1 ? 'end' : ''}>
        <FancyBox on:open={() => active = true} on:close={() => active = false}>
            <Card class="flex">
                <Picture {...item} size="contain"/>
            </Card>
            <section slot="box" class="flex" style="width: 100vw; height: calc(100vw * 1.428)">
                <Card class="flex">
                    <Picture {...item} size="contain"/>
                </Card>
            </section>
        </FancyBox>
    </div>
</Carousel>

<style>
    :global(.documents.active .scroll-x-center > *) {
        transform: none
    }
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
