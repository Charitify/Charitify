<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'

    const dispatch = createEventDispatcher()

    export let src
    export let alt
    export let size = 'cover'
    export let srcBig = undefined
    export let id = undefined
    export let width = undefined
    export let height = undefined

    let isError = false
    let loadingSrcSmall = true
    let loadingSrcBig = true

    $: wrapClassProp = classnames('picture', $$props.class, size, { loadingSrcSmall, loadingSrcBig, isError })

    function imgService(node, postFix) {
        if (node.complete) {
            onLoad(node, postFix)
        } else {
            node.onload = () => onLoad(node, postFix)
            node.onerror = () => onError(node, postFix)
        }
    }

    function onLoad(node, postFix) {
        changeLoading(postFix, false)
        isError = false
        dispatch(`load${postFix}`, node)

        if (!srcBig || !loadingSrcBig) {
            dispatch('load', node)
        }
    }

    function onError(node, postFix) {
        changeLoading(postFix, false)
        isError = true
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

</script>

<figure class={wrapClassProp}>
    <img
            use:imgService={'Small'}
            {id}
            {alt}
            {src}
            {width}
            {height}
            class="pic pic-1x"
    />

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
        background-color: rgba(var(--color-black), .04);
    }

    .picture .pic {
        flex-grow: 1;
        overflow: hidden;
        align-self: stretch;
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

    .picture.cover .pic {
        object-fit: cover;
    }

    .picture.contain .pic {
        object-fit: contain;
    }

    .picture.isError .pic-1x,
    .picture.isError .pic-2x,
    .picture.loadingSrcSmall .pic-1x,
    .picture.loadingSrcBig .pic-2x {
        opacity: 0;
    }
</style>
