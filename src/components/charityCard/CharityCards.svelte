<script>
    import { classnames, delay } from '@utils'
    import Carousel from '@components/Carousel.svelte'
    import CharityCard from './CharityCard.svelte'

    export let amount = 5

    let carousel = new Array(amount).fill(0)

    let active = false
    async function setFancyActive(isActive) {
        if (!isActive) {
            await delay(300)
        }
        active = isActive
    }
</script>

<Carousel items={carousel} size="auto" let:index={index} class={classnames('charities', { active })}>
    <div class={!index ? 'start' : index === carousel.length - 1 ? 'end' : ''}>
       <CharityCard
            src="https://placeimg.com/300/300/people"
            total={20000}
            current={3500}
            city="Львів"
            title="Допоможи Сірку"
            setFancyActive={setFancyActive}
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
