<script>
    import { Picture, Card } from '../components'

    const cardSample = {
        src: 'https://placeimg.com/300/300/people',
        alt: '10грн',
    }

    const all = new Array(5).fill(cardSample)
</script>

<ul class="scroll-x-center">
    {#each all as img}
        <li>
            <Card class="flex">
                <Picture {...img} size="contain"/>
            </Card>
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: flex;
        align-items: flex-start;
        max-width: 100%;
        overflow-y: hidden;
        overflow-x: auto;
        padding: var(--screen-padding) 0;
    }

    li {
        flex: none;
        display: flex;
        align-self: stretch;
        height: 180px;
        width: 126px;
        padding: 0 5px;
    }

    li:first-child {
        padding-left: 15px;
    }

    li:last-child {
        padding-right: 15px;
    }
</style>
