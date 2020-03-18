<script>
    import { createEventDispatcher } from 'svelte'
    import { waitUntil, classnames } from '../utils'
    import Picture from './Picture.svelte'

    const dispatch = createEventDispatcher()

    /**
     *
     * @type {number | {
     *     src: string,
     *     srcBig: string,
     *     alt: string,
     *     onClick?: function,
     * }[]}
     */
    export let items = []
    export let dots = true
    export let size = 'stretch'
    export let initIndex = 0

    $: activeDot = initIndex
    $: classProp = classnames('carousel', size, $$props.class)

    function carousel(node) {
        initScrollPosition(node)
        node.addEventListener('scroll', onScroll)
        return { destroy: () => node.removeEventListener('scroll', onScroll) }
    }

    function onScroll(e) {
        try {
            getActiveDot(e.target)
        } catch (err) { console.warn('Carousel does not work.', err) }
    }

    function getActiveDot(parent) {
        const { scrollLeft } = parent
        const { width } = parent.getBoundingClientRect()
        const newActiveDot = Math.round(scrollLeft / width)
        if (activeDot !== newActiveDot) activeDot = newActiveDot
    }

    function initScrollPosition(parent) {
        const { width } = parent.getBoundingClientRect()
        waitUntil(() => {
            parent.scrollLeft = width * activeDot
            if (parent.scrollLeft !== width * activeDot) {
              throw new Error('Not set.')
            }
        }, { interval: 50 })
    }

    function onClick(item, index, e) {
        dispatch('click', { item, index, e })
        if (typeof item.onClick === 'function') item.onClick(item, index, e)
    }

</script>

<section aria-label="carousel" class={classProp}>
    <ul use:carousel class="carousel-inner scroll-x-center">
        {#each items as item, index}
            <li class="fluid">
                <button type="button" class="fluid" on:click={onClick.bind(null, item, index)}>
                    <slot {item} {index}>
                        <Picture {...item}/>
                    </slot>
                </button>
            </li>
        {/each}
    </ul>


    {#if dots}
        <ul class="carousel-dots">
            {#each items as _item, i}
                <li class={i === activeDot ? 'active' : ''}></li>
            {/each}
        </ul>
    {/if}
</section>

<style>
    .carousel, .carousel-inner, .carousel-inner li, button {
        position: relative;
        flex: none;
        display: flex;
        overflow: hidden;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
    }

    .carousel.stretch .fluid {
        width: 100%;
    }

    .carousel.auto .fluid {
        width: auto;
    }

    .carousel {
        width: 100%;
        border-radius: var(--border-radius-big);
    }

    .carousel-inner::-webkit-scrollbar {
        display: none;
    }

    .carousel .carousel-inner {
        width: 100%;
        overflow-y: hidden;
        overflow-x: scroll;
    }

    .carousel-dots {
        position: absolute;
        left: 0;
        bottom: 10px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .carousel-dots li {
        position: relative;
        width: 8px;
        height: 8px;
        margin: 5px;
        border-radius: 50%;
        overflow: hidden;
        background-color: rgba(var(--theme-bg-color));
        box-shadow: var(--shadow-primary)
    }

    li.active {
        transform: scale(1.5);
    }
</style>
