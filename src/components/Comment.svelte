<script>
    import { classnames } from '../utils'
    import Icon from './Icon.svelte'
    import Card from './Card.svelte'
    import Avatar from './Avatar.svelte'

    export let src = undefined
    export let date = undefined
    export let title = undefined
    export let amount = undefined

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="comment flex flex-align-start" style="padding: 20px">

        <Avatar src={src} alt={title} size="medium" class="comment-ava"/>

        <s></s>
        <s></s>
        <s></s>
        <s></s>

        <div class="flex flex-column flex-1" style="overflow: hidden">
            <h3 class="text-ellipsis">{ title }</h3>

            <br class="tiny">

            <pre class="h5" style="line-height: 1.46">
                <slot>
                     [No comment]
                </slot>
            </pre>

            <br class="small">

            <p class="flex flex-align-center flex-justify-between">
                <span class="h5" style="rgba(var(--color-black), .3)">{ date }</span>
                <span class="h5">Reply</span>
                <span class="h5 flex flex-align-center">
                    <span style={`opacity: ${amount > 2 ? 1 : .6}`}>
                        <Icon type="heart-filled" is="danger" size="small"/>
                    </span>
                    <s></s>
                    <span>{ amount }</span>
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
