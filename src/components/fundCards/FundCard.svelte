<script>
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Button from '@components/Button.svelte'
    import Progress from '@components/Progress.svelte'
    import FancyBox from '@components/FancyBox.svelte'
    import Carousel from '@components/Carousel.svelte'

    export let id = undefined
    export let src = undefined
    export let city = undefined
    export let title = undefined
    export let total = undefined
    export let current = undefined
    export let currency = undefined
</script>

<Card class="flex flex-column">
    
    <div style="height: 160px" class="flex">
        <section 
            class="flex full-width full-height" 
            on:touchstart={e => (e.stopPropagation(), false)}
            on:touchmove={e => (e.stopPropagation(), false)}
            on:touchend={e => (e.stopPropagation(), false)}
        >
            <Carousel 
                items={[{ src, alt: title }, { src, alt: title }, { src, alt: title }]}
                disableFancy={true}
                dotsBelow={false}
                rounded={false}
            />    
        </section>
    </div>

    <section class="container flex flex-column flex-justify-between flex-1">
        <div class="flex-none overflow-hidden" style="height: calc(2 * var(--font-line-height-h2) + var(--font-line-height) + 20px + 5px + 10px)">
            <Br size="20"/>     

            <h2 class="text-ellipsis-multiline" style="--max-lines: 2">
                {title}
            </h2>

            <Br size="5"/>     

            {#if city}
                <p class="flex flex-align-center font-secondary font-w-500" style="opacity: .7; margin-left: -2px">
                    <Icon type="location-mark" size="small"/>
                    <s></s>
                    <span>{city}</span>
                </p>
                <Br size="10"/>     
            {/if}
        </div>

        <div>
            <p class="font-secondary flex flex-wrap flex-align-end" style="letter-spacing: -0.5px">
                <span class="h1 font-w-500">{currency} {current}</span>
                <s></s>
                <span class="h4">/ {currency} {total}</span>
            </p>

            <Br size="20"/>  
            <Progress value={Math.floor(current / total * 100)}/>
            <Br size="40"/>  

            <Button size="big" is="success" href={id}>
                <span class="h2 font-secondary font-w-600">
                    Допомогти
                </span>
            </Button>

            <Br size="30"/>     
        </div>
    </section>
</Card>

<style>
</style>
