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
    const SWIPE_SPEED = 2
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
        return function () {
            console.log(action)
            lastPosition = startPosition.x
            drawTransform(ref, startPosition.x, startPosition.y)
        }
    }

    let ref = null
    let xSwipe = 0
    let ySwipe = 0
    let lastPosition = 0
    let startPosition = START_POSITION

    function addSwipe(el) {
        new Swipe(el)
                .run()
                .onLeft(handleHorizontalSwipe)
                .onRight(handleHorizontalSwipe)
                .onTouchEnd(async () => {
                    setDuration(ref, DURATION)
                    setTimeout(() => setDuration(ref, 0), DURATION)
                    if (xSwipe > -THRESHOLD) {
                        lastPosition = startPosition.x
                        drawTransform(el, startPosition.x, startPosition.y)
                    } else {
                        lastPosition = -BOUNDRY
                        drawTransform(el, lastPosition, ySwipe)
                    }
                })
    }

    function handleHorizontalSwipe(xDown, xUp, evt, el) {
        xSwipe = lastPosition + (xUp - xDown) * SWIPE_SPEED
        drawTransform(el, xSwipe, ySwipe)
    }
    function setDuration(el, ms) {
        el && (el.style.transitionDuration = `${ms}ms`)
    }
    function drawTransform(el, x, y) {
        el && (el.style.transform = `matrix(1, 0, 0, 1, ${x}, ${y})`)
    }
</script>

<section use:addSwipe bind:this={ref}>
    {#each items as item}
        <div class="relative">
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
