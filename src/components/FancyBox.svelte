<script>
    import { createEventDispatcher } from 'svelte'
    import { fly } from 'svelte/transition'
    import { classnames, Swipe, delay } from '@utils'

    const dispatch = createEventDispatcher()

    let active = null

    function onClick(e) {
        active = !active

        if (!active) {
            dispatch('close', e)
            document.body.classList.remove('no-scroll-container')
            document.documentElement.classList.remove('no-scroll-container')
        } else {
            dispatch('open', e)
            document.body.classList.add('no-scroll-container')
            document.documentElement.classList.add('no-scroll-container')
        }
    }

    $: classProp = classnames('fancy-box-ghost', { active })

    let ySwipe = 0
    const THRESHOLD = 100

    function swipe(el) {
        new Swipe(el).run()
                .onUp(handleVerticalSwipe)
                .onDown(handleVerticalSwipe)
                .onTouchEnd(async () => {
                    if (ySwipe > THRESHOLD) {
                        ySwipe = window.innerHeight
                        active = false
                        drawTransform(el, ySwipe)
                        await delay(100)
                    } else if (ySwipe < -THRESHOLD) {
                        ySwipe = -window.innerHeight
                        active = false
                        drawTransform(el, ySwipe)
                        await delay(100)
                    }
                    ySwipe = 0
                    drawTransform(el, ySwipe)
                })
    }

    function handleVerticalSwipe(yDown, yUp, _evt, el) {
        ySwipe = yUp - yDown
        drawTransform(el, ySwipe)
    }

    function drawTransform(el, y) {
        el.style.transform = `translate3d(0, ${y}px, 0)`
    }

    let slots
    $: slots = $$props.$$slots || {}
</script>

<section role="button" class="fancy-box" on:click={onClick}>
    <slot {active}></slot>
</section>

{#if !slots.box}
    <button
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
        height: 100vh;
        display: flex;
        overflow: hidden;
        align-items: stretch;
        justify-content: stretch;
        background-color: rgba(var(--color-black), .75);
        outline: 20px solid rgba(var(--color-black), .75);
        transition: .1s ease-out;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
    }

    .fancy-box-ghost.active {
        opacity: 1;
        transform: none;
        pointer-events: auto;
    }
</style>
