<script>
    import Carousel from '@components/Carousel.svelte'
    import FundCard from './FundCard.svelte'

    /**
     * @type {{
     *  id: string,
     *  src: string,
     *  total: number,
     *  current: number,
     *  currency: string,
     *  city: string,
     *  title: string,
     * }}
     */
    export let items = []
</script>

<Carousel {items} size="auto" let:index={index} let:item={item}  class="charities">
    <div class={!index ? 'start' : index === items.length - 1 ? 'end' : ''} key={item.id}>
       <FundCard
            src={item.src}
            total={item.total}
            current={item.current}
            currency={item.currency}
            city={item.city}
            title={item.title}
       />
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
        height: 470px;
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
