<script>
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Loader from '@components/loader'
    import Button from '@components/Button.svelte'
    import Progress from '@components/Progress.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Carousel from '@components/Carousel.svelte'

    export let src = null
    export let city = null
    export let title = null
    export let total = null
    export let current = null
    export let currency = null
</script>

<Card class="flex flex-column">
    
    <div style="height: 160px" class="flex">
        <Carousel 
            items={[{ src, alt: title }, { src, alt: title }, { src, alt: title }]}
            disableFancy={true}
            dotsBelow={false}
            rounded={false}
            stopPropagation={true}
        />    
    </div>

    <section class="container flex flex-column flex-justify-between flex-1">
        <div class="flex-none overflow-hidden" style="height: calc(2 * var(--font-line-height-h2) + var(--font-line-height) + 20px + 5px + 10px)">
            <Br size="20"/>     

            {#if title !== null}
                <h2 class="text-ellipsis-multiline" style="--max-lines: 2">
                    {title}
                </h2>
            {:else}
                <Loader type="h2" />
                <Loader type="h2" />
            {/if}

            <Br size="5"/>     

            {#if city !== null}
                <p class="flex flex-align-center font-secondary font-w-500" style="opacity: .7; margin-left: -2px">
                    <Icon type="location" size="small"/>
                    <s></s>
                    <span>{city}</span>
                </p>
                <Br size="10"/>     
            {:else}
                <div style="width: 40%"><Loader type="p" /></div>
            {/if}
        </div>

        <div>
            <p class="font-secondary flex flex-wrap flex-align-end" style="letter-spacing: -0.5px">
                {#if current !== null && total !== null}
                    <span class="h1 font-w-500">{currency} {current}</span>
                    <s></s>
                    <span class="h4">/ {currency} {total}</span>
                {:else}
                    <div style="width: 80%; flex: none"><Loader type="h1" /></div>
                {/if}
            </p>

            <Br size="20"/>  
            <Progress value={Math.floor(current / total * 100)}/>
            <Br size="40"/>  

            <slot name="button"></slot>

            <Br size="30"/>     
        </div>
    </section>
</Card>

<style>
</style>
