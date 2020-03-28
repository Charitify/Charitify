<script>
    import { createEventDispatcher } from 'svelte'
    import { fly } from 'svelte/transition'
    import { classnames, Swipe, delay } from '@utils'
    import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

    const START_POSITION = 20
    const THRESHOLD = 100

    const dispatch = createEventDispatcher()

    let active = null
    let fancyBox = null
    let slots = $$props.$$slots || {}

    function onClick(e) {
        const newActive = !active

        setActive(newActive)

        if (newActive) {
            drawTransform(fancyBox, 0)
            dispatch('open', e)
        } else {
            drawTransform(fancyBox, START_POSITION)
            dispatch('close', e)
        }
    }
     
    function setActive(isActive) {
        active = isActive

        setTimeout(() => {
            if (active) {
                disableBodyScroll(fancyBox);
            } else {
                enableBodyScroll(fancyBox);
            }
        })
    }

    $: classProp = classnames('fancy-box-ghost', { active })

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
                        await delay(300)
                    } else if (ySwipe < -THRESHOLD) {
                        setActive(false)
                        drawTransform(el, ySwipe - 50)
                        await delay(300)
                    }

                    ySwipe = START_POSITION
                    drawTransform(el, ySwipe)
                })
    }

    function handleVerticalSwipe(yDown, yUp, evt, el) {
        ySwipe = yUp - yDown
        drawTransform(el, ySwipe)
    }

    function drawTransform(el, y) {
        el && (el.style.transform = `translate3d(0, ${y}px, 0)`)
    }
</script>

<section role="button" class="fancy-box" on:click={onClick}>
    <slot {active}></slot>
</section>

{#if !slots.box}
    <button
            bind:this={fancyBox}
            use:swipe
            in:fly="{{ y: 20, duration: 200 }}"
            type="button"
            class={classProp}
            on:click={onClick}
    >
        <slot></slot>
    </button>
{/if}

{#if active !== null && slots.box}
    <button
            bind:this={fancyBox}
            use:swipe
            in:fly="{{ y: 20, duration: 200 }}"
            type="button"
            class={classProp}
            on:click={onClick}
    >
        <slot name="box"></slot>
    </button>
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
        justify-content: stretch;
        background-color: rgba(var(--color-black), .75);
        outline: 20px solid rgba(var(--color-black), .75);
        transition: .3s ease-out;
        opacity: 0;
        transform: translate3d(0,20px,0);
        pointer-events: none;
        overflow: scroll;
        -webkit-overflow-scrolling: touch;
    }

    .fancy-box-ghost.active {
        opacity: 1;
        transform: translate3d(0,0,0);
        pointer-events: auto;
    }
</style>
