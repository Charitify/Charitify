<script>
    import { Br, Card, Progress } from '@components'

    export let cardTop = {}
</script>

<Card class="container">
    <Br size="20"/>

    <h2>{cardTop.title}</h2>
    <h3 class="font-w-normal" style="opacity: .7">{cardTop.subtitle}</h3>

    <Br size="25"/>
    <p class="font-secondary">
        <span class="h1 font-w-500">{cardTop.currency} {cardTop.currentSum}</span>
        <span class="h3"> / {cardTop.currency} {cardTop.neededSum}</span>
    </p>
    <Br size="20"/>

    <Progress value={Math.floor(cardTop.currentSum / cardTop.neededSum * 100)}/>

    <Br size="40"/>
</Card>