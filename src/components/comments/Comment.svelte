<script>
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Avatar from '@components/Avatar.svelte'

    export let src = undefined
    export let date = undefined
    export let title = undefined
    export let amount = undefined
    export let checked = undefined

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="comment flex flex-align-start" style="padding: 20px">

        <div class="flex relative">
            <Avatar src={src} alt={title} size="medium"/>

            {#if checked}
            <div class="absolute flex" style="top: -1px; right: -1px; width: 20px; height: 20px; overflow: hidden">
                <Icon type="polygon" is="info"/>
                <div class="absolute-center flex" style="width: 10px; height: 10px;">
                    <Icon type="check-flag" is="light"/>
                </div>
            </div>
            {/if}
        </div>

        <s></s>
        <s></s>
        <s></s>
        <s></s>

        <div class="flex flex-column flex-1" style="overflow: hidden">
            <h3 class="text-ellipsis font-w-500">{ title }</h3>

            <Br size="5"/>

            <pre class="h4 font-w-300" style="line-height: 1.46;">
                <slot>
                     [No comment]
                </slot>
            </pre>

            <Br size="10"/>

            <div class="flex flex-align-center flex-justify-between">
                <p>
                    <span class="h4" style="opacity: .3">{ date }</span>
                    <s></s>
                    <s></s>
                    <s></s>
                    <s></s>
                    <span class="h4" style="opacity: .7">Відповісти</span>
                    <s></s>
                    <s></s>
                </p>
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
