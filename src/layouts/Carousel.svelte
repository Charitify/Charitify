<script>
    import { Swipe, SwipeItem } from '../plugins'
    import { Picture } from '../components'

    const cards = [
        {
            src: 'https://placeimg.com/30/30/tech',
            title: 'The main title and short description.',
            percent: 45,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/30/30/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/30/30/arch',
            title: 'Second bigger major card title line with a bit longer description.',
            percent: 65,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/30/30/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/30/30/any',
            title: 'The main title and short description.',
            percent: 5,
            orgHead: 'Tinaramisimuss Kandelakinuskas',
            orgHeadSrc: 'https://placeimg.com/30/30/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/30/30/nature',
            title: 'The main title and short description.',
            percent: 95,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/30/30/people',
            organization: 'ORG giant charity organization of big Charitify company.',
        },
    ]

    const imagesDefault = cards.map(card => ({
        src: [card.src, card.src, card.src],
        alt: card.title,
    }))

    /**
     *
     * @type {{
     *     src: string,
     *     alt: string,
     *     onClick?: function,
     * }[]}
     */
    export let images = imagesDefault

    $: imagesArr = [].concat(images).map(img => typeof img === 'string' ? { src: img } : img)
</script>

<section>
    <Swipe>
        {#each imagesArr as img}
            <SwipeItem>
                <Picture src={img.src} alt={img.alt}/>
            </SwipeItem>
        {/each}
    </Swipe>
</section>

<style>
    section {
        z-index: 0;
        flex-grow: 1;
        overflow: hidden;
        margin-bottom: 2px;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
    }
</style>
