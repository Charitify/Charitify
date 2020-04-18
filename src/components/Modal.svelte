<script>
    import { createEventDispatcher, tick } from 'svelte'
    import { fly } from "svelte/transition";
    import { Swipe } from '@services'
    import { safeGet, classnames, delay, bodyScroll, stopPropagationUntilEnd } from "@utils";
    import { modals } from "@store";
    import Portal from "./Portal.svelte";
    import Br from "./Br.svelte";

    const dispatch = createEventDispatcher()
    
    const DURATION = 250
    const THRESHOLD = 100
    const START_POSITION = {
        x: 300,
        y: 0
    }

    export let id
    export let ref = null
    export let size = 'full'    // small/medium/big/full
    export let swipe = []       // up down left right all
    export let open = null
    export let startPosition = START_POSITION
    export let blockBody = true
    export let withHeader = true

    let active
    let isBodyBlocked = false

    $: isSwipe = {
        up: safeGet(() => swipe.includes('up') || swipe.includes('all')),
        down: safeGet(() => swipe.includes('down') || swipe.includes('all')),
        left: safeGet(() => swipe.includes('left') || swipe.includes('all')),
        right: safeGet(() => swipe.includes('right') || swipe.includes('all')),
    }
    $: active = safeGet(() => open !== null ? open : $modals[`modal-${id}`].open, null)
    $: classProp = classnames('modal', size, { active })
    $: onActiveChange(active)
    $: blockScroll(ref)

    function blockScroll(modal) {
        if (blockBody && active && !isBodyBlocked) {
            bodyScroll.disableScroll(modal);
            isBodyBlocked = true
        } else if (blockBody && !active && isBodyBlocked) {
            bodyScroll.enableScroll(modal);
            isBodyBlocked = false
        }
    }

    async function onActiveChange(active) {
        if (active) {
            setDuration(ref, DURATION)
            setTimeout(() => setDuration(ref, 0), DURATION)
            drawTransform(ref, 0, 0)
            blockScroll(ref)
            await tick()
            dispatch('open')
        } else {
            blockScroll(ref)
            await tick()
            dispatch('close')
        }
    }

    function setActive(isActive) {
        if (open !== null) open = isActive
        modals.update(s => ({ ...s, [`modal-${id}`]: { open: isActive } }))

        if (!isActive && !isScrollerInRange) {
            isScrollerInRange = true
        }
    }

    let xSwipe = 0
    let ySwipe = 0
    let isScrollerInRange = true

    function onScrollerInRange(isInRange) {
        isScrollerInRange = isInRange
    }

    function addSwipe(el) {
        stopPropagationUntilEnd(el, onScrollerInRange)

        new Swipe(el)
                .run()
                .onUp(isSwipe.up ? handleVerticalSwipe : null)
                .onDown(isSwipe.down ? handleVerticalSwipe : null)
                .onLeft(isSwipe.left ? handleHorizontalSwipe : null)
                .onRight(isSwipe.right ? handleHorizontalSwipe : null)
                .onTouchEnd(async () => {
                    if (xSwipe > THRESHOLD) {
                        setActive(false)
                        drawOpacity(el, xSwipe + 50, ySwipe)
                        drawTransform(el, xSwipe + 50, ySwipe)
                        await delay(DURATION)
                    } else if (xSwipe < -THRESHOLD) {
                        setActive(false)
                        drawOpacity(el, xSwipe - 50, ySwipe)
                        drawTransform(el, xSwipe - 50, ySwipe)
                        await delay(DURATION)
                    }
                    
                    if (ySwipe > THRESHOLD) {
                        setActive(false)
                        drawOpacity(el, xSwipe, ySwipe + 50)
                        drawTransform(el, xSwipe, ySwipe + 50)
                        await delay(DURATION)
                    } else if (ySwipe < -THRESHOLD) {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        setActive(false)
                        drawOpacity(el, xSwipe, ySwipe - 50)
                        drawTransform(el, xSwipe, ySwipe - 50)
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
        if (isScrollerInRange) return
        ySwipe = yUp - yDown
        drawTransform(el, xSwipe, ySwipe)
        drawOpacity(el, xSwipe, ySwipe)
    }
    function handleHorizontalSwipe(xDown, xUp, evt, el) {
        if (isScrollerInRange) return
        xSwipe = xUp - xDown
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

    function appear(node, params) {
		const existingTransform = getComputedStyle(node).transform.replace('none', '');
        const getScale = t => .6 + .4 * t
        const getX = t => startPosition.x - startPosition.x * t
		return {
			duration: DURATION,
			css: (t) => `opacity: ${t}; transform: matrix(${getScale(t)}, 0, 0, ${getScale(t)}, ${getX(t)}, 0)`
		};
    }
</script>

{#if active !== null}
    <Portal>
        <div
            id={`modal-${id}`}
            bind:this={ref}
            aria-hidden="true" 
            class={classProp}
            use:addSwipe
            in:appear
            on:click={() => setActive(false)}
        >
            {#if withHeader}
                <slot name="header">
                    <header class="modal-header">
                        <h2 style="padding: 15px 20px">Закрити</h2>
                        <button type="button" on:click={setActive.bind(null, false)} class="close">&#10005;</button>
                    </header>
                </slot>
            {/if}
            <div
                class="modal-inner"
                tabindex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="модальне вікно"
                on:click={e => e.stopPropagation()}
            >
                {#if withHeader}
                    <Br size="60"/>
                {/if}
                <slot props={safeGet(() => $modals[`modal-${id}`], {}, true)}/>
            </div>
        </div>
    </Portal>
{/if}

<style>
    .modal {
        z-index: 9;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        overflow-x: hidden;
        overflow-y: auto;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        touch-action: manipulation;
        user-select: none;
        background-color: rgba(var(--color-black), .75);
        outline: 50px solid rgba(var(--color-black), .75);
        transition-timing-function: ease-out;
        opacity: 0;
        pointer-events: none;
    }

    .modal.active {
        opacity: 1;
        pointer-events: auto;
    }

    .modal-inner {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;
        overflow: hidden;
        background-color: rgba(var(--theme-color-primary));
    }
    .small .modal-inner {
        width: 200px;
        border-radius: var(--border-radius-big);
    }

    .medium .modal-inner {
        width: calc(100vw - var(--screen-padding) * 2);
        border-radius: var(--border-radius-big);
    }
    .big .modal-inner {
        width: calc(100% - var(--screen-padding) * 2);
        height: calc(100% - var(--screen-padding) * 2);
        border-radius: var(--border-radius-big);
    }

    .full {
        align-items: stretch;
        justify-content: stretch;
    }

    .full .modal-inner {
        flex: none;
        width: 100%;
        min-height: 100%;
        border-radius: 0;
    }

    .modal-header {
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgb(var(--color-white));
        background-color: rgb(var(--color-info));
    }

    .modal-header button.close {
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
    }
</style>   