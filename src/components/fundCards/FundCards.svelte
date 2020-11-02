<script>
    import Carousel from '@components/Carousel.svelte'
    import Button from '@components/Button.svelte'
    import FundCard from './FundCard.svelte'

    /**
     * @type {{
     *  id: string,
     *  total: number,
     *  photos: string,
     *  current: number,
     *  currency: string,
     *  city: string,
     *  title: string,
     * }}
     */
    export let items = [{}, {}, {}]
</script>

<Carousel {items} size="auto" let:index={index} let:item={item} class="charities">
    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''} key={item.id}>
        <FundCard
            total={item.total}
            current={item.current}
            currency={item.currency}
            city={item.city}
            title={item.title}
            photos={item.photos}
        >
            <span slot="button">
                <slot name="button" {item}>
                    <Button size="big" is="success" href={`/funds/${item.id}`}>
                        <span class="h2 font-secondary font-w-600">
                            Допомогти
                        </span>
                    </Button>
                </slot>
            </span>
        </FundCard>
    </div>
</Carousel>

<style>
    :global(.charities.active .scroll-x-center > *) {
        transform: none
    }
    div {
        flex: none;
        display: flex;
        align-self: stretch;
        height: 500px;
        width: 77vw;
        max-width: 350px;
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
