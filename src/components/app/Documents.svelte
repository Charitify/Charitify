<script>
    import { classnames } from '@utils'
    import Card from '@components/Card.svelte'
    import Picture from '@components/Picture.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Carousel from '@components/Carousel.svelte'

    export let items = []

    let active = false
</script>

<Carousel items={items} size="auto" dots={false} let:item={item} let:index={index} class={classnames('documents', { active })}>
    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''}>
        <FancyBox on:open={() => active = true} on:close={() => active = false}>
            <Card class="flex">
                <Picture src={item.src} alt={item.title} size="contain"/>
            </Card>
            <section slot="box" class="flex" style="width: 100vw; height: calc(100vw * 1.428)">
                <Card class="flex">
                    <Picture src={item.src} srcBig={item.src2x} alt={item.title} size="contain"/>
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
