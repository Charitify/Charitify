<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Button from '@components/Button.svelte'
    import Picture from '@components/Picture.svelte'

    const dispatch = createEventDispatcher()

    export let src = undefined
    export let date = undefined
    export let title = undefined
    export let likes = undefined
    export let isLiked = undefined
    export let subtitle = undefined

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="news-item flex">

        <div class="flex flex-none relative" style="width: 110px">
            <Picture src={src} alt={title}/>
        </div>

        <div class="flex flex-column flex-1 container overflow-hidden" style="padding-top: 20px; padding-bottom: 10px">
            <h3 class="font-w-500 text-ellipsis-multiline" style="--max-lines: 2">{ title }</h3>

            <Br size="10"/>

            <p class="font-w-300 text-ellipsis-multiline" style="--max-lines: 3">{ subtitle }</p>

            <div class="flex flex-align-center flex-justify-between">
                <p>
                    <span class="h4" style="opacity: .3">{ date }</span>
                </p>
                <s></s>
                <s></s>
                <span class="h5 flex flex-align-center font-secondary" style="min-width: 4em">
                    <Button size="medium" on:click={(e) => (e.stopPropagation(), dispatch('click', !isLiked))}>
                        <span style={`opacity: ${isLiked ? 1 : .5}`}>
                            <Icon type="heart-filled" is="danger" size="small"/>
                        </span>
                        <s></s>
                        <s></s>
                        {#if likes}
                            <h4>{ likes }</h4>
                        {/if}
                    </Button>
                </span>
            </div>
        </div>

    </section>
</Card>

<style>
</style>
