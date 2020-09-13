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
            drawTransform(swipeEl, startPosition.x, startPosition.y)
        }
    }

    let ref = null
    let xSwipe = 0
    let ySwipe = 0
    let startPosition = START_POSITION

    function addSwipe(el) {
        new Swipe(el)
                .run()
                .onLeft(handleLeftSwipe)
                .onRight(handleRightSwipe)
                .onTouchEnd(async (_, __, evt) => {
                    const swipeEl = getSwipeItem(evt)
                    if (!swipeEl) return
                    setDuration(swipeEl, DURATION)
                    setTimeout(() => setDuration(swipeEl, 0), DURATION)
                    if (xSwipe > -THRESHOLD) {
                        setActive(swipeEl, false)
                        drawTransform(swipeEl, startPosition.x, startPosition.y)
                    } else {
                        setActive(swipeEl, true)
                        drawTransform(swipeEl, -BOUNDRY, ySwipe)
                    }
                })
    }

    function setActive(el, isActive) {
        if (isActive) el && el.classList.add('active')
        else el && el.classList.remove('active')
    }
    function handleLeftSwipe(xDown, xUp, evt, el) {
        const swipeEl = getSwipeItem(evt)
        if (!swipeEl) return
        const lastPosition = getLastPossition(swipeEl)
        xSwipe = Math.max(-BOUNDRY, lastPosition + (xUp - xDown) * SWIPE_SPEED)
        drawTransform(swipeEl, xSwipe, ySwipe)
    }
    function handleRightSwipe(xDown, xUp, evt, el) {
        const swipeEl = getSwipeItem(evt)
        if (!swipeEl) return
        const lastPosition = getLastPossition(swipeEl)
        xSwipe = Math.min(startPosition.x, lastPosition + (xUp - xDown) * SWIPE_SPEED)
        drawTransform(swipeEl, xSwipe, ySwipe)
    }
    function setDuration(el, ms) {
        el && (el.style.transitionDuration = `${ms}ms`)
    }
    function drawTransform(el, x, y) {
        el && (el.style.transform = `matrix(1, 0, 0, 1, ${x}, ${y})`)
    }
    function getLastPossition(el) {
        return el.classList.contains('active') ? -BOUNDRY : startPosition.x
    }
    function getSwipeItem(evt) {
        return safeGet(() => evt.target.closest('.swipe-item')) 
        || safeGet(() => evt.detail.target.closest('.swipe-item'))
    }
</script>

<section use:addSwipe bind:this={ref}>
    {#each items as item}
        <div class="relative swipe-item">
            <a href={`${basePath}/${item.id}`} class="block">
                <ListItem {basePath} item={getItem(item)}>
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
                <li><Button on:click={onAction('delete')} size="small"><Icon type="trash" is="dark" size="huge"/></Button></li>
                <li><Button on:click={onAction('copy')} size="small"><Icon type="link" is="dark" size="huge"/></Button></li>
                <li><Button on:click={onAction('edit')} size="small"><Icon type="edit" is="dark" size="huge"/></Button></li>
            </ul>
        </div>
        <Br size="20"/>
    {/each}
</section>

<style>
    section {
        transition-timing-function: linear;
    }

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
</style>
