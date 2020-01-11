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

    $: wrapClassProp = classnames('picture', $$props.class, { loading, isError })

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

<figure class={wrapClassProp}>
    <img
            {id}
            {alt}
            {src}
            {width}
            {height}
            class="pic"
            on:load={onLoad}
            on:error={onError}
    />

    <figcaption>
        <slot></slot>
    </figcaption>
</figure>

<style>
    .picture {
        flex-grow: 1;
        align-self: stretch;
        display: inline-flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;
    }

    .picture .pic {
        flex-grow: 1;
        align-self: stretch;
        object-fit: cover;
        object-position: center;
        transition: opacity .3s ease-in;
    }

    .picture.loading .pic {
        opacity: 0;
    }
</style>