<script>
    import Carousel from '../Carousel.svelte'
    import CharityCard from './CharityCard.svelte'

    export let amount = 5

    let carousel = new Array(amount).fill(0)
</script>

<Carousel items={carousel} size="auto" let:index={index}>
    <div class={!index ? 'start' : index === carousel.length - 1 ? 'end' : ''}>
       <CharityCard
            src="https://placeimg.com/300/300/people"
            total={20000}
            current={3500}
            city="Львів"
            title="Допоможи Сірку"
       />
    </div>
</Carousel>

<style>
    div {
        flex: none;
        display: flex;
        align-self: stretch;
        height: 470px;
        width: 77vw;
        max-width: 350px;
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
