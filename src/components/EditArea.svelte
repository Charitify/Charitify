<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'

    const dispatch = createEventDispatcher()

    import Br from './Br.svelte'
    import Icon from './Icon.svelte'
    import Button from './Button.svelte'

    export let off = false

    $: classProp = classnames('edit-area', $$props.class, { off })

    function onClick(e) {
        if (!off) {
            dispatch('click', e)
        }
    }
</script>

<section role="button" class={classProp} on:click={onClick}>
    <slot></slot>

    {#if !off}
        <Br size="30"/>
        <Button size="small" is="info" class="no-filter">
            <span class="h3 font-secondary font-w-500 flex flex-align-center">
                Редагувати
                <s></s>
                <s></s>
                <Icon type="edit" size="small" is="light"/>
            </span>
        </Button>
        <Br size="40"/>
    {/if}
</section>

<style>
    .edit-area {
        --color-bg: rgba(var(--theme-color-primary-opposite), .1);
        --color-lines: rgba(var(--theme-color-primary-opposite));

        padding: 0 var(--screen-padding);
        background-image: linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%),
                          linear-gradient(to right, var(--color-lines) 50%, rgba(var(--color-black), 0) 0%);
        background-color: var(--color-bg);
        background-position: top, bottom;
        background-size: 20px 1px;
        background-repeat: repeat-x;
    }

    .edit-area:not(.off) > :global(*) {
        pointer-events: none;
    }

    .edit-area.off {
        background: none;
    }

    .edit-area:not(.off) :global(*:not(.no-filter)) {
        filter: grayscale(100%);
    }
</style>
