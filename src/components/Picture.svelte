<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let src
    export let alt
    export let size = 'cover'
    export let id = undefined
    export let width = undefined
    export let height = undefined

    let isError = false
    let loadingSrc = true

    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrc, isError })

    function imgService(node) {
        if (node.complete) {
            isError = false
            loadingSrc = false
            dispatch('load', node)
        } else {
            node.onload = () => {
                isError = false
                loadingSrc = false
                dispatch('load', node)
            }
            node.onerror = () => {
                isError = true
                loadingSrc = false
                dispatch('error', node)
            }
        }
    }
</script>

<figure class={wrapClassProp}>
    <img
            use:imgService
            {id}
            {alt}
            {src}
            {width}
            {height}
            class="pic pic-1x"
    />

    <figcaption>
        <slot></slot>
    </figcaption>
</figure>

<style>
    .picture {
        position: relative;
        flex-grow: 1;
        align-self: stretch;
        display: inline-flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;
        background-color: rgba(var(--color-black), .04);
    }

    .picture .pic {
        flex-grow: 1;
        overflow: hidden;
        align-self: stretch;
        object-position: center;
        transition: opacity .3s ease-in;
    }

    .picture.cover .pic {
        object-fit: cover;
    }

    .picture.contain .pic {
        object-fit: contain;
    }

    .picture.isError .pic-1x,
    .picture.loadingSrc .pic-1x {
        opacity: 0;
    }
</style>
