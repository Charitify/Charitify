<script>
    import { Icon, Loader } from '@components'

    export let likes = null
    export let views = null
</script>

<p class="container flex flex-justify-between flex-align-center">
    <span class="flex flex-align-center">
        <Icon is="danger" type="heart-filled" size="medium"/>
        <s></s>
        <s></s>
        {#if likes !== null}
            <span class="font-secondary font-w-600 h3">{likes}</span>
        {:else}
            <span class="font-secondary font-w-600 h3 relative">
                <span style="visibility: hidden">199</span>
                <Loader type="h3" absolute/>
            </span>  
        {/if}
    </span>
    <span class="flex flex-align-center">
        <Icon type="eye" size="medium" class="theme-svg-fill"/>
        <s></s>
        <s></s>
        {#if views !== null}
            <span class="font-secondary font-w-600 h3">{views}</span>
        {:else}
            <span class="font-secondary font-w-600 h3 relative">
                <span style="visibility: hidden">199</span>
                <Loader type="h3" absolute/>
            </span>  
        {/if}
    </span>
</p>