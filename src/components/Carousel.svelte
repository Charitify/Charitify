<script>
    import { createEventDispatcher } from 'svelte'
    import { waitUntil, classnames } from '@utils'
    import Picture from '@components/Picture.svelte'
    import FancyBox from '@components/FancyBox.svelte'
import About from '../routes/organizations/view/_About.svelte';

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
    export let dotsBelow = true
    export let rounded = true
    export let size = 'stretch'
    export let initIndex = 0
    export let disableFancy = false
    export let stopPropagation = undefined

    let parent = null

    $: activeDot = initIndex
    $: classProp = classnames('carousel', size, $$props.class, { dots, dotsBelow, rounded, filled: items && items.length })
    $: setScrollPosition(parent, initIndex)

    function carousel(node) {
        node.ontouchstart = e => stopPropagation && (e.stopPropagation())
        node.ontouchmove = e => stopPropagation && (e.stopPropagation())
        node.ontouchend = e => stopPropagation && (e.stopPropagation())

        parent = node
        setScrollPosition(node, activeDot)
        node.addEventListener('scroll', onScroll)
        return { 
            destroy: () => {
                node.removeEventListener('scroll', onScroll)
                node.ontouchstart= null
                node.ontouchmove= null
                node.ontouchend= null
            }
        }
    }

    function onScroll(e) {
        try {
            getActiveDot(e.target)
        } catch (err) { console.warn('Carousel does not work.', err) }
    }

    function getActiveDot(parent) {
        const { scrollLeft, scrollWidth, offsetWidth } = parent
        const dotAmount = Array.from(parent.children).length
        const scrollX = scrollLeft / (scrollWidth - offsetWidth)
        const newActiveDot = Math.round(scrollX * (dotAmount - 1))
        if (activeDot !== newActiveDot && !isNaN(newActiveDot)) activeDot = newActiveDot
    }

    function setScrollPosition(parent, activeDot) {
        if (!parent) return
        const { width } = parent.getBoundingClientRect()
        waitUntil(() => {
            parent.scrollLeft = Math.round(width * activeDot)
            if (parent.scrollLeft !== Math.round(width * activeDot)) {
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
    <ul 
        use:carousel
        class="carousel-inner scroll-x-center"
    >
        {#if items !== null && Array.isArray(items)}
            {#each items as item, index}
                <li class="fluid" role="button" on:click={onClick.bind(null, item, index)}>
                    <slot {item} {index}>
                        <FancyBox disabled={disableFancy}>
                            <Picture key="picture" {...item} alt={item.alt || 'Фото слайду'}/>
                            <section slot="box" class="flex full-width">
                                <Picture key="picture" {...item} alt={item.alt || 'Фото слайду'}/>
                            </section>
                        </FancyBox>
                    </slot>
                </li>
            {/each}
        {/if}
    </ul>


    {#if dots && Array.isArray(items)}
        <ul class="carousel-dots">
            {#each items as _item, i}
                <li class={i === activeDot ? 'active' : ''}></li>
            {/each}
        </ul>
    {/if}
</section>

<style>
    .carousel.rounded > .carousel-inner {
       border-radius: var(--border-radius-big);
    }

    .carousel, .carousel-inner, .carousel-inner > li {
        position: relative;
        flex: none;
        display: flex;
        overflow: hidden;
        text-align: left;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
    }

    .carousel.dots.dotsBelow.filled {
        padding-bottom: 40px;
    }

    .carousel.filled > .carousel-inner {
        background-color: transparent;
    }

    .carousel.dotsBelow .carousel-dots {
        bottom: 0;
    }

    .carousel.dotsBelow .carousel-dots li {
        background-color: rgba(var(--theme-bg-color-opposite));
    }

    .carousel.stretch > .carousel-inner > .fluid {
        flex: none;
        width: 100%;
    }

    .carousel.auto > .carousel-inner > .fluid {
        width: auto;
    }

    .carousel {
        width: 100%;
    }

    /* 3d out for good accessibility of desktop brows of desktop browsers */
    /*.carousel-inner::-webkit-scrollbar {*/
    /*    display: none;*/
    /*}*/

    .carousel > .carousel-inner {
        width: 100%;
        overflow-y: hidden;
        overflow-x: scroll;
        background-color: rgba(var(--theme-bg-color-opposite), .04);
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
        box-shadow: var(--shadow-primary);
        background-color: rgba(var(--color-light));
    }

    .carousel-dots li:not(.active) {
        opacity: .5;
    }

    .carousel-dots li.active {
        transform: scale(1.5);
    }
</style>
