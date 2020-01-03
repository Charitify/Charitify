<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let src
    export let alt
    export let id = undefined
    export let width = undefined
    export let height = undefined

    let loading = true
    let isError = false

    $: options = {
        id,
        width,
        height,
        class: 'pic',
    }

    $: wrapOptions = {
        class: classnames('picture', $$props.class, { loading, isError }),
    }

    function onLoad(e) {
        loading = false
        dispatch('load', e)
    }

    function onError(e) {
        loading = false
        isError = true
        dispatch('error', e)
    }
</script>

<figure {...wrapOptions}>
    <img {...options} src={src} alt={alt} on:load={onLoad} on:error={onError} />

    <figcaption>
        <slot></slot>
    </figcaption>
</figure>

<style>
    .picture {
        background-color: #888;
    }

    .picture .pic {
        transition: opacity .3s ease-in;
    }

    .picture.loading .pic {
        opacity: 0;
    }
</style>
