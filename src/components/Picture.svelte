<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '../utils'

    const dispatch = createEventDispatcher()

    export let src
    export let alt
    export let srcBig = undefined
    export let id = undefined
    export let width = undefined
    export let height = undefined

    let loadingSrc = true
    let loadingSrcBig = true
    let isError = false

    $: wrapClassProp = classnames('picture', $$props.class, { loadingSrc, loadingSrcBig, isError })

    function onLoadSrc(e) {
        loadingSrc = false
        dispatch('load', e)
    }

    function onErrorSrc(e) {
        loadingSrc = false
        isError = true
        dispatch('error', e)
    }

    function onLoadSrcBig(e) {
        loadingSrcBig = false
        dispatch('loadBig', e)
    }

    function onErrorSrcBig(e) {
        loadingSrcBig = false
        isError = true
        dispatch('errorBig', e)
    }
</script>

<figure class={wrapClassProp}>
    <img
            {id}
            {alt}
            {src}
            {width}
            {height}
            class="pic pic-1x"
            on:load={onLoadSrc}
            on:error={onErrorSrc}
    />
    {#if srcBig && !loadingSrc}
        <img
                {alt}
                {width}
                {height}
                src={srcBig}
                class="pic pic-2x"
                on:load={onLoadSrcBig}
                on:error={onErrorSrcBig}
        />
    {/if}
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
    }

    .picture .pic {
        flex-grow: 1;
        align-self: stretch;
        object-fit: cover;
        object-position: center;
        transition: opacity .3s ease-in;
    }

    .picture .pic-2x {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    /*.picture.loadingSrc .pic-1x,*/
    /*.picture.loadingSrcBig .pic-2x {*/
    /*    opacity: 0;*/
    /*}*/
</style>
