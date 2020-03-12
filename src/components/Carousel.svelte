<script>
    import Picture from './Picture.svelte'

    const cards = [
        {
            src: 'https://placeimg.com/300/300/tech',
            title: 'The main title and short description.',
            percent: 45,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/arch',
            title: 'Second bigger major card title line with a bit longer description.',
            percent: 65,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/any',
            title: 'The main title and short description.',
            percent: 5,
            orgHead: 'Tinaramisimuss Kandelakinuskas',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG charity of Charitify.',
        },
        {
            src: 'https://placeimg.com/300/300/nature',
            title: 'The main title and short description.',
            percent: 95,
            orgHead: 'Tina Kandelaki',
            orgHeadSrc: 'https://placeimg.com/300/300/people',
            organization: 'ORG giant charity organization of big Charitify company.',
        },
    ]

    const imagesDefault = cards.map(card => ({
        src: card.src,
        alt: card.title,
    }))

    /**
     *
     * @type {number | {
     *     src: string,
     *     srcBig: string,
     *     alt: string,
     *     onClick?: function,
     * }[]}
     */
    export let items = imagesDefault
</script>

<ul aria-label="carousel" class="scroll-x-center">
    {#each items as item}
        <li>
            <slot {item}>
                <Picture {...item}/>
            </slot>
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
        border-radius: var(--border-radius-big);
    }

    ul::-webkit-scrollbar {
        display: none;
    }

    li {
        width: 100%;
        flex: none;
        display: flex;
        align-items: stretch;
        justify-content: stretch;
    }
</style>
