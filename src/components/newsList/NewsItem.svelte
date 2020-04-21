<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Button from '@components/Button.svelte'
    import Picture from '@components/Picture.svelte'
    import Loader from '@components/loader'

    const dispatch = createEventDispatcher()

    export let src = null
    export let date = null
    export let title = null
    export let likes = null
    export let isLiked = null
    export let subtitle = null

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="news-item flex">

        <div class="flex flex-none relative" style="width: 110px">
            <Picture src={src} alt={title}/>
        </div>

        <div class="flex flex-column flex-1 container overflow-hidden" style="padding-top: 20px; padding-bottom: 5px">

            {#if title !== null}
                <h3 class="font-w-500 text-ellipsis-multiline" style="--max-lines: 2">{ title }</h3>
            {:else}
                <div style="width: 80%"><Loader type="h3"/></div>
                <div style="width: 80%"><Loader type="h3"/></div>
            {/if}

            <Br size="10"/>

            {#if subtitle !== null}
                <p class="font-w-300 text-ellipsis-multiline" style="--max-lines: 3">{ subtitle }</p>
            {:else}
                <div style="width: 100%"><Loader type="p"/></div>
                <div style="width: 100%"><Loader type="p"/></div>
            {/if}

            <div class="flex flex-align-center flex-justify-between">
                <p>
                    {#if date !== null}
                        <span class="h4" style="opacity: .3">{ date }</span>
                    {:else}
                        <div style="width: 60%"><Loader type="h4"/></div>
                    {/if}
                </p>
                <s></s>
                <s></s>
                <span class="h5 flex flex-align-center font-secondary" style="min-width: 4em">
                    <Button size="medium" on:click={(e) => dispatch('onLike', !isLiked)}>
                        <span style={`opacity: ${isLiked ? 1 : .5}`}>
                            <Icon type="heart-filled" is="danger" size="small"/>
                        </span>
                        <s></s>
                        <s></s>
                        {#if likes !== null}
                            <h4>{ likes }</h4>
                        {:else}
                            <span class="h4 relative">
                                <span style="visibility: hidden">199</span>
                                <Loader type="h4" absolute/>
                            </span>  
                        {/if}
                    </Button>
                </span>
            </div>
        </div>

    </section>
</Card>

<style>
</style>
