<script>
    import { classnames } from '../utils'
    import Icon from './Icon.svelte'
    import Card from './Card.svelte'
    import Avatar from './Avatar.svelte'

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
            <Avatar src={src} alt={title} size="medium" class="comment-ava"/>

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

            <br class="tiny">

            <pre class="h4 font-w-300" style="line-height: 1.46;">
                <slot>
                     [No comment]
                </slot>
            </pre>

            <br class="small">

            <p class="flex flex-align-center flex-justify-between">
                <span class="h5" style="rgba(var(--color-black), .3)">{ date }</span>
                <span class="h5">Відповісти</span>
                <span class="h5 flex flex-align-center">
                    <span style={`opacity: ${amount > 2 ? 1 : .6}`}>
                        <Icon type="heart-filled" is="danger" size="small"/>
                    </span>
                    <s></s>
                    <s></s>
                    <h4>{ amount }</h4>
                    <s></s>
                    <s></s>
                    <s></s>
                    <s></s>
                </span>
            </p>
        </div>

    </section>
</Card>

<style>
</style>
