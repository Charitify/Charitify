<script>
    import { createEventDispatcher, tick } from 'svelte'
    import { fly } from 'svelte/transition'
    import { Swipe } from '@services'
    import { classnames, delay, bodyScroll } from '@utils'
    import Portal from './Portal.svelte';

    const dispatch = createEventDispatcher()
    
    const DURATION = 150
    const START_POSITION = 20
    const THRESHOLD = 100

    export let ref = null
    export let blockBody = true

    let active = null
    let slots = $$props.$$slots || {}

    async function onClick(e) {
        const newActive = !active

        setActive(newActive)

        if (newActive) {
            drawTransform(ref, 0)
        } else {
            drawTransform(ref, START_POSITION)
        }
    }

    async function setActive(isActive) {
        active = isActive

        await tick()

        const container = ref.querySelector('[body-scroll-lock-container]')
        if (active) {
            setDuration(ref, DURATION)
            setTimeout(() => setDuration(ref, 0), DURATION)
            blockBody && bodyScroll.disableScroll(container || ref);
            dispatch('open')
        } else {
            setDuration(ref, DURATION)
            blockBody && bodyScroll.enableScroll(container || ref);
            dispatch('close')
        }
    }

    $: classProp = classnames('fancy-box-ghost', { active })
    $: classPropWrap = classnames('fancy-box', $$props.class)

    let ySwipe = START_POSITION
    function swipe(el) {
        new Swipe(el)
                .run()
                .onUp(handleVerticalSwipe)
                .onDown(handleVerticalSwipe)
                .onTouchEnd(async () => {
                    if (ySwipe > THRESHOLD) {
                        setActive(false)
                        drawTransform(el, ySwipe + 50)
                        drawOpacity(el, ySwipe + 50)
                        await delay(DURATION)
                    } else if (ySwipe < -THRESHOLD) {
                        setActive(false)
                        drawTransform(el, ySwipe - 50)
                        drawOpacity(el, ySwipe - 50)
                        await delay(DURATION)
                    }

                    if (ySwipe > THRESHOLD || ySwipe < -THRESHOLD) {
                        ySwipe = START_POSITION
                        drawTransform(el, ySwipe)
                        el.style.opacity = null
                    } else {
                        setDuration(ref, DURATION)
                        setTimeout(() => setDuration(ref, 0), DURATION)
                        ySwipe = 0
                        drawTransform(el, ySwipe)
                        el.style.opacity = null
                    }
                })
    }

    function handleVerticalSwipe(yDown, yUp, evt, el) {
        ySwipe = yUp - yDown
        drawTransform(el, ySwipe)
        drawOpacity(el, ySwipe)
    }

    function drawTransform(el, y) {
        let scale = 1 - Math.abs(y / (window.innerHeight * 1.5))
        el && (el.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${y})`)
    }
    function setDuration(el, ms) {
        el && (el.style.transitionDuration = `${ms}ms`)
    }
    function drawOpacity(el, y) {
        el && (el.style.opacity = 1 - Math.min(Math.abs(y / (THRESHOLD * 1.5)), 1))
    }
</script>

<section role="button" class={classPropWrap} on:click={onClick}>
    <slot {active}></slot>
</section>

{#if !slots.box}
    <Portal>
        <section
                bind:this={ref}
                use:swipe
                in:fly="{{ y: START_POSITION, duration: 200 }}"
                class={classProp}
                on:touchmove={e => e.stopPropagation()}
        >
            <button type="button" on:click={onClick}>&#10005;</button>
            <slot></slot>
        </section>
    </Portal>  
{/if}

{#if active !== null && slots.box}
    <Portal>
        <section
                bind:this={ref}
                use:swipe
                in:fly="{{ y: START_POSITION, duration: 200 }}"
                class={classProp}
        >
            <button type="button" on:click={onClick}>&#10005;</button>
            <slot name="box"></slot>
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
        outline: 20px solid rgba(var(--color-black), .75);
        transition-timing-function: linear;
        opacity: 0;
        padding: 0 var(--screen-padding);
        transform: translate3d(0,20px,0);
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
        top: 10px;
        right: 10px;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--min-interactive-size);
        height: var(--min-interactive-size);
    }
</style>
