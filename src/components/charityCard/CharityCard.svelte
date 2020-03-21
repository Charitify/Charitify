<script>
    import Icon from '../Icon.svelte'
    import Card from '../Card.svelte'
    import Button from '../Button.svelte'
    import Picture from '../Picture.svelte'
    import Progress from '../Progress.svelte'

    export let src = undefined
    export let city = undefined
    export let title = undefined
    export let total = undefined
    export let current = undefined
</script>

<Card>
    <div style="height: 160px" class="flex">
        <Picture {src} alt={title}/>
    </div>

    <section class="container">
        <br>

        <h2>{title}</h2>

        {#if city}
            <p class="flex flex-align-center font-secondary font-w-500" style="opacity: .7; margin-left: -2px">
                <Icon is="dark" type="location-mark" size="small"/>
                <s></s>
                <span>{city}</span>
            </p>
        {/if}

        <br>
        <br>
        <br>

        <p class="font-secondary">
            <span class="h1 font-w-500">₴ {current}</span>
            <span class="h3"> / ₴ {total}</span>
        </p>

        <br>

        <Progress value={Math.floor(current / total * 100)}/>

        <br class="big">
        <br class="small">

        <Button size="big" is="success">
            <span class="h2 font-secondary font-w-600">
                Допомогти
            </span>
        </Button>

        <br>
        <br class="small">
        <br class="tiny">
    </section>
</Card>

<style>
</style>
