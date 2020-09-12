<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'

    const dispatch = createEventDispatcher()

    export let src
    export let alt
    export let bg = true
    export let size = 'cover'
    export let srcBig = undefined
    export let id = undefined
    export let width = undefined
    export let height = undefined

    let loadingSrcSmall = true
    let loadingSrcBig = true
    let isErrorSmall = false
    let isErrorBig = false

    $: wrapClassProp = classnames('picture', $$props.class, size, { bg, loadingSrcSmall, loadingSrcBig, isErrorSmall, isErrorBig })

    function imgService(node, postFix) {
        if (node.complete) {
            onLoad(node, postFix)
        } else {
            node.onload = onLoad.bind(null, node, postFix)
            node.onerror = onError.bind(null, node, postFix)
        }
    }

    function onLoad(node, postFix) {
        changeLoading(postFix, false)
        changeError(postFix, false)
        dispatch(`load${postFix}`, node)

        if (!srcBig || !loadingSrcBig) {
            dispatch('load', node)
        }
    }

    function onError(node, postFix) {
        changeLoading(postFix, false)
        changeError(postFix, true)
        dispatch(`error${postFix}`, node)
    }

    function changeLoading(type, isLoading) {
        switch (type) {
            case 'Small':
                loadingSrcSmall = isLoading
                break
            case 'Big':
                loadingSrcBig = isLoading
                break
        }
    }

    function changeError(type, isError) {
        switch (type) {
            case 'Small':
                isErrorSmall = isError
                break
            case 'Big':
                isErrorBig = isError
                break
        }
    }

</script>

<figure class={wrapClassProp}>
    {#if src}
        <img
            use:imgService={'Small'}
            {id}
            {alt}
            {src}
            {width}
            {height}
            class="pic pic-1x"
        />
    {/if}

    {#if srcBig && !loadingSrcSmall}
        <img
            use:imgService={'Big'}
            {alt}
            {width}
            {height}
            src={srcBig}
            class="pic pic-2x"
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

    .picture.bg {
        background-color: rgba(var(--theme-bg-color-opposite), .04);
    }

    .picture .pic {
        flex-grow: 1;
        overflow: hidden;
        align-self: stretch;
        object-position: center;
        transition: opacity .5s ease-in;
    }

    .picture .pic-2x {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .picture.cover .pic {
        object-fit: cover;
    }

    .picture.contain .pic {
        object-fit: contain;
    }

    .picture.isErrorSmall .pic-1x,
    .picture.isErrorBig .pic-2x,
    .picture.loadingSrcSmall .pic-1x,
    .picture.loadingSrcBig .pic-2x {
        opacity: 0;
    }
</style>
