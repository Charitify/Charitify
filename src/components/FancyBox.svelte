<script>
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    let active = false
    function onClick(e) {
        active = !active

        if (!active)
          dispatch('close', e)
        else
          dispatch('open', e)
    }
</script>

<section role="button" class="fancy-box" on:click={onClick}>
    <slot></slot>
</section>

{#if active}
    <button type="button" class="fancy-box-ghost" on:click={onClick}>
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
        align-items: center;
        justify-content: center;
        padding: var(--screen-padding);
        background-color: rgba(var(--color-black), 0);
        animation: fadeInBox .2s ease-in-out forwards;
    }

    @keyframes fadeInBox {
        to {
            background-color: rgba(var(--color-black), .75);
        }
    }
</style>
