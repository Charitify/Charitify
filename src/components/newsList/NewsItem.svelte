<script>
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Picture from '@components/Picture.svelte'

    export let src = undefined
    export let date = undefined
    export let title = undefined
    export let amount = undefined
    export let subtitle = undefined

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="news-item flex">

        <div class="flex relative" style="width: 110px">
            <Picture src={src} alt={title}/>
        </div>

        <div class="flex flex-column flex-1" style="padding: 20px">
            <h3 class="text-ellipsis font-w-500">{ title }</h3>

            <Br size="5"/>

            <p class="text-ellipsis font-w-300">{ subtitle }</p>

            <Br size="10"/>

            <div class="flex flex-align-center flex-justify-between">
                <p>
                    <span class="h4" style="opacity: .3">{ date }</span>
                </p>
                <s></s>
                <s></s>
                <span class="h5 flex flex-align-center font-secondary" style="min-width: 4em">
                    <span style={`opacity: ${amount > 2 ? 1 : .5}`}>
                        <Icon type="heart-filled" is="danger" size="small"/>
                    </span>
                    <s></s>
                    <s></s>
                    {#if amount}
                        <h4>{ amount }</h4>
                    {/if}
                </span>
            </div>
        </div>

    </section>
</Card>

<style>
</style>
