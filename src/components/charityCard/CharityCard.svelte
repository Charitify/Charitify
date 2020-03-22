<script>
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Card from '@components/Card.svelte'
    import Button from '@components/Button.svelte'
    import Picture from '@components/Picture.svelte'
    import Progress from '@components/Progress.svelte'

    export let src = undefined
    export let city = undefined
    export let title = undefined
    export let total = undefined
    export let current = undefined
</script>

<Card class="flex flex-column">
    <div style="height: 160px" class="flex">
        <Picture {src} alt={title}/>
    </div>

    <section class="container flex flex-column flex-justify-between flex-1">
        <div class="flex-none overflow-hidden">
            <Br size="20"/>     

            <h2>{title}</h2>

            {#if city}
                <p class="flex flex-align-center font-secondary font-w-500" style="opacity: .7; margin-left: -2px">
                    <Icon is="dark" type="location-mark" size="small"/>
                    <s></s>
                    <span>{city}</span>
                </p>
            {/if}
        </div>

        <div>
            <p class="font-secondary">
                <span class="h1 font-w-500">₴ {current}</span>
                <span class="h3"> / ₴ {total}</span>
            </p>

            <Br size="20"/>  
            <Progress value={Math.floor(current / total * 100)}/>
            <Br size="40"/>  

            <Button size="big" is="success">
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
