<script>
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Avatar from '@components/Avatar.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Loader from '@components/loader'

    export let src = null
    export let date = null
    export let title = null
    export let amount = null
    export let checked = null

    $: classProp = classnames($$props.class)
</script>

<Card class={classProp}>
    <section class="comment flex flex-align-start" style="padding: 20px">

        <div class="flex relative">
            <FancyBox>
                <Avatar src={src} alt={title} size="medium"/>
                <section slot="box" class="flex full-width full-height" style="height: 100vw">
                    <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                        <Avatar src={src} alt={title}/>
                    </div>
                </section>
            </FancyBox>

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

            {#if title !== null}
                <h3 class="text-ellipsis font-w-500">{ title }</h3>
            {:else}
                <div style="width: 60%"><Loader type="h3" /></div>
            {/if}

            <Br size="5"/>

            <pre class="h4 font-w-300" style="line-height: 1.46;">
                <slot>
                     [No comment]
                </slot>
            </pre>

            <Br size="10"/>

            <div class="flex flex-align-center flex-justify-between">
                <p class="flex flex-align-center flex-justify-between">
                    {#if date !== null}
                        <span class="h4" style="opacity: .3">{ date }</span>
                        <s></s>
                        <s></s>
                        <s></s>
                        <s></s>
                        <span class="h4" style="opacity: .7">Відповісти</span>
                        <s></s>
                        <s></s>
                    {:else}
                        <div style="width: 80%"><Loader type="h4" /></div>
                    {/if}
                </p>
                <span class="h5 flex flex-align-center font-secondary" style="min-width: 4em">
                    <span style={`opacity: ${amount > 2 ? 1 : .5}`}>
                        <Icon type="heart-filled" is="danger" size="small"/>
                    </span>
                    <s></s>
                    <s></s>
                    {#if amount !== null}
                        <h4>{ amount }</h4>
                    {:else}
                        <span class="h4 relative flex-self-start">
                            <span style="visibility: hidden">199</span>
                            <Loader type="h4" absolute/>
                        </span>  
                    {/if}
                </span>
            </div>
        </div>

    </section>
</Card>

<style>
</style>
