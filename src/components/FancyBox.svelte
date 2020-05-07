<script>
    import { createEventDispatcher, tick } from 'svelte'
    import { fly } from 'svelte/transition'
    import { Swipe } from '@services'
    import { classnames, delay, bodyScroll, safeGet } from '@utils'
    import Icon from '@components/Icon.svelte';
    import Portal from './Portal.svelte';

    const dispatch = createEventDispatcher()
    
    const DURATION = 250
    const THRESHOLD = 50
    const SWIPE_SPEED = .5
    const START_POSITION = {
        x: 0,
        y: 20
    }

    export let ref = null
    export let blockBody = true
    export let swipe = ['all']       // up down left right all
    export let disabled = false
    export let extraLock = false
    export let startPosition = START_POSITION

    let active = null
    let slots = $$props.$$slots || {}

    async function onClick(e) {
        if (disabled) return

        const newActive = !active

        setActive(newActive)

        if (newActive) {
            drawTransform(ref, 0, 0)
        } else {
            drawTransform(ref, startPosition.x, startPosition.y)
        }
    }

    async function setActive(isActive) {
        active = isActive

        await tick()

        if (active) {
            setDuration(ref, DURATION)
            setTimeout(() => setDuration(ref, 0), DURATION)
            blockBody && bodyScroll.disableScroll(ref, { extraLock });
            dispatch('open')
        } else {
            setDuration(ref, DURATION)
            blockBody && bodyScroll.enableScroll(ref, { extraLock });
            dispatch('close')
        }
    }

    $: isSwipe = {
        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),
        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),
        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),
        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),
    }
    $: classProp = classnames('fancy-box-ghost', { active })
    $: classPropWrap = classnames('fancy-box', $$props.class)

    let xSwipe = 0
    let ySwipe = 0

    function addSwipe(el) {
        new Swipe(el)
                .run()
                .onUp(isSwipe.up ? handleVerticalSwipe : null)
                .onDown(isSwipe.down ? handleVerticalSwipe : null)
                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)
                .onRight(isSwipe.right ? handleHorizontalSwipe : null)
                .onTouchEnd(async () => {
                    if (xSwipe > THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        setActive(false)
                        drawTransform(el, xSwipe + 50, ySwipe)
                        drawOpacity(el, xSwipe + 50, ySwipe)
                        await delay(DURATION)
                    } else if (xSwipe < -THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        setActive(false)
                        drawTransform(el, xSwipe - 50, ySwipe)
                        drawOpacity(el, xSwipe - 50, ySwipe)
                        await delay(DURATION)
                    }
                    
                    if (ySwipe > THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        setActive(false)
                        drawTransform(el, xSwipe, ySwipe + 50)
                        drawOpacity(el, xSwipe, ySwipe + 50)
                        await delay(DURATION)
                    } else if (ySwipe < -THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        setActive(false)
                        drawTransform(el, xSwipe, ySwipe - 50)
                        drawOpacity(el, xSwipe, ySwipe - 50)
                        await delay(DURATION)
                    }

                    if (xSwipe <= THRESHOLD && xSwipe >= -THRESHOLD && ySwipe <= THRESHOLD && ySwipe >= -THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        drawTransform(el, 0, 0)
                    } else {
                        drawTransform(el, startPosition.x, startPosition.y)
                    }

                    xSwipe = 0
                    ySwipe = 0
                    el.style.opacity = null
                })
    }

    function handleVerticalSwipe(yDown, yUp, evt, el) {
        ySwipe = (yUp - yDown) * SWIPE_SPEED
        drawTransform(el, xSwipe, ySwipe)
        drawOpacity(el, xSwipe, ySwipe)
    }
    function handleHorizontalSwipe(xDown, xUp, evt, el) {
        xSwipe = (xUp - xDown) * SWIPE_SPEED
        drawTransform(el, xSwipe, ySwipe)
        drawOpacity(el, xSwipe, ySwipe)
    }

    function drawTransform(el, x, y) {
        const delta = Math.abs(x) > Math.abs(y) ? x : y
        let scale = 1 - Math.abs(delta / window.innerHeight)
        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`)
    }
    function setDuration(el, ms) {
        el && (el.style.transitionDuration = `${ms}ms`)
    }
    function drawOpacity(el, x, y) {
        const delta = Math.abs(x) > Math.abs(y) ? x : y
        el && (el.style.opacity = 1 - Math.min(Math.abs(delta / (THRESHOLD * 1.5)), 1))
    }
</script>

<section role="button" class={classPropWrap} on:click={onClick}>
    <slot {active}></slot>
</section>

{#if active !== null}
    <Portal>
        <section
            bind:this={ref}
            use:addSwipe
            class={classProp}
        >
            <button type="button" on:click={onClick}>
                <Icon type="close" size="big" is="light"/>
            </button>
            {#if slots.box}
                <slot name="box"></slot>
            {:else}
                <slot></slot>
            {/if}
        </section>
    </Portal>
{/if}

<style>
    .fancy-box {
        position: relative;
        width: 100%;
        flex: none;
        display: flex;
        overflow: hidden;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
    }

    .fancy-box-ghost {
        z-index: 10;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        overflow: hidden;
        align-items: stretch;
        justify-content: center;
        flex-direction: column;
        user-select: none;
        touch-action: manipulation;
        background-color: rgba(var(--color-black), .75);
        outline: 150px solid rgba(var(--color-black), .75);
        transition-timing-function: linear;
        opacity: 0;
        padding: 0 var(--screen-padding);
        transform: translate3d(0,30px,0);
        pointer-events: none;
        will-change: transform, opacity;
    }

    .fancy-box-ghost > * {
        max-width: 100%;
        max-height: 100%;
    }

    .fancy-box-ghost.active {
        opacity: 1;
        transform: translate3d(0,0,0);
        pointer-events: auto;
    }

    button {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        color: rgb(var(--color-white));
    }
</style>
