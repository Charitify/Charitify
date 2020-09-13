<script>
    import { Swipe } from '@services'
    import { safeGet } from '@utils'
    import Br from '../Br.svelte'
    import Icon from '../Icon.svelte'
    import Button from '../Button.svelte'
    import ListItem from './ListItem.svelte'

    export let type // fund / organization
    export let items = []
    export let basePath = ''

    const DURATION = 250
    const THRESHOLD = 100
    const BOUNDRY = 200
    const SWIPE_SPEED = 1
    const START_POSITION = {
        x: 0,
        y: 0
    }

    function getItem(item) {
        return {
            src: safeGet(() => type === 'fund' ? item.avatars[0].src : item.avatars[0]),
            title: item.title,
            subtitle: type === 'fund' ? item.subtitle : item.description,
            progress: type === 'fund' ? +(item.current_sum / item.need_sum * 100).toFixed(2) : item.percent,
            liked: item.is_liked,
        }
    }

    function onAction(action) {
        return function (evt) {
            console.log(action)
            const swipeEl = getSwipeItem(evt)
            if (!swipeEl) return
            setActive(swipeEl, false)
            setCanBeActive(swipeEl, false)
            drawTransform(swipeEl, START_POSITION.x, START_POSITION.y)
        }
    }

    let xSwipe = 0
    let ySwipe = 0

    function addSwipe(el) {
        new Swipe(el)
                .run()
                .onUp(handleVerticalSwipe)
                .onDown(handleVerticalSwipe)
                .onLeft(handleLeftSwipe)
                .onRight(handleRightSwipe)
                .onTouchEnd(async (_, __, evt) => {
                    const swipeEl = getSwipeItem(evt)
                    if (!swipeEl) return
                    setDuration(swipeEl, DURATION)
                    setTimeout(() => setDuration(swipeEl, 0), DURATION)
                    if (xSwipe <= -THRESHOLD || (xSwipe >= THRESHOLD && !isElActive(swipeEl))) {
                        setActive(swipeEl, true)
                        setCanBeActive(swipeEl, true)
                        drawTransform(swipeEl, -BOUNDRY, ySwipe)
                    } else {
                        setActive(swipeEl, false)
                        setCanBeActive(swipeEl, false)
                        drawTransform(swipeEl, START_POSITION.x, START_POSITION.y)
                    }
                })
    }

    function handleVerticalSwipe(yDown, yUp, evt) {
        const swipeEl = getSwipeItem(evt)
        if (!swipeEl) return
        xSwipe = getLastPossition(swipeEl)
    }

    function handleLeftSwipe(xDown, xUp, evt, el) {
        const swipeEl = getSwipeItem(evt)
        if (!swipeEl) return
        const lastPosition = getLastPossition(swipeEl)
        xSwipe = Math.max(-BOUNDRY, lastPosition + (xUp - xDown) * SWIPE_SPEED)
        checkElCanBeActive(swipeEl, xSwipe)
        drawTransform(swipeEl, xSwipe, ySwipe)
    }
    function handleRightSwipe(xDown, xUp, evt, el) {
        const swipeEl = getSwipeItem(evt)
        if (!swipeEl) return
        const lastPosition = getLastPossition(swipeEl)
        xSwipe = Math.min(THRESHOLD, lastPosition + (xUp - xDown) * SWIPE_SPEED)
        checkElCanBeActive(swipeEl, xSwipe)
        drawTransform(swipeEl, xSwipe, ySwipe)
    }

    function checkElCanBeActive(swipeEl, xSwipe) {
        if (xSwipe > -THRESHOLD && isElCanBeElActive(swipeEl)) {
            setCanBeActive(swipeEl, false)
        } else if (xSwipe <= -THRESHOLD  && !isElCanBeElActive(swipeEl)) {
            setCanBeActive(swipeEl, true)
        }
    }
    
    function setDuration(el, ms) {
        el && (el.style.transitionDuration = `${ms}ms`)
    }
    function drawTransform(el, x, y) {
        el && (el.style.transform = `matrix(1, 0, 0, 1, ${x}, ${y})`)
    }

    function setCanBeActive(el, isActive) {
        if (isActive) el && el.classList.add('can-be-active')
        else el && el.classList.remove('can-be-active')
    }
    function isElCanBeElActive(el) {
        return el.classList.contains('can-be-active')
    }

    function setActive(el, isActive) {
        if (isActive) el && el.classList.add('active')
        else el && el.classList.remove('active')
    }
    function isElActive(el) {
        return el.classList.contains('active')
    }

    function getLastPossition(el) {
        return isElActive(el) ? -BOUNDRY : START_POSITION.x
    }
    function getSwipeItem(evt) {
        return safeGet(() => evt.target.closest('.swipe-item')) 
        || safeGet(() => evt.detail.target.closest('.swipe-item'))
    }
</script>

<section use:addSwipe>
    {#each items as item}
        <div class="relative swipe-item">
            <a href={`${basePath}/${item.id}`} class="block">
                <ListItem item={getItem(item)}>
                    <div slot="bottom-left" class="flex flex-align-baseline">
                        {#if type === 'fund'}
                            <span class="h2 font-secondary">{item.current_sum}{item.currency || ''} /<s/></span>
                            <span class="h4 font-secondary">{item.need_sum}{item.currency || ''}</span>
                        {:else if type === 'organization'}
                            <span class="h2 font-secondary">{getItem(item).progress || '0'}%</span>
                        {/if}
                    </div>
                </ListItem>
            </a>
            <ul>
                <li><Button on:click={onAction('delete')} size="small"><Icon type="trash" size="huge"/></Button></li>
                <li><Button on:click={onAction('copy')} size="small"><Icon type="link" size="huge"/></Button></li>
                <li><Button on:click={onAction('edit')} size="small"><Icon type="edit" size="huge"/></Button></li>
            </ul>
        </div>
        <Br size="20"/>
    {/each}
</section>

<style>
    ul {
        position: absolute;
        top: 0;
        left: 100%;
        width: 200px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    ul li {
        transition: .3s ease-in-out;
        opacity: 0;
        transform: scale(.5) translateX(100px);
    }

    ul li:nth-child(1) {
        transition-delay: 0ms;
    }

    ul li:nth-child(2) {
        transition-delay: 100ms;
    }

    ul li:nth-child(3) {
        transition-delay: 200ms;
    }

    .swipe-item.can-be-active ul li {
        opacity: 1;
        transform: none;
    }
</style>
