<script>
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

<ul aria-label="carousel">
    {#each imagesArr as img}
        <li>
            <Picture src={img.src} alt={img.alt}/>
        </li>
    {/each}
</ul>

<style>
    ul {
        width: 100%;
        display: flex;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
        overflow-y: hidden;
        overflow-x: auto;
        margin-bottom: 2px;
        box-shadow: var(--shadow-primary);
        border-radius: var(--border-radius);
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x mandatory;
    }

    li {
        width: 100%;
        flex: none;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        scroll-snap-align: center;
    }
</style>
