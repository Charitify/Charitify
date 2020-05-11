<script>
    import { Br, Card, Progress, Loader } from '@components'

    export let cardTop = {
        title: null,
        subtitle: null,
        current_sum: null,
        need_sum: null,
    }
</script>

<Card class="container">
    <Br size="20"/>

    {#if cardTop.title !== null}
        <h2>{cardTop.title}</h2>
    {:else}
        <div style="width: 80%"><Loader type="h2"/></div>
        <div style="width: 80%"><Loader type="h2"/></div>
    {/if}

    {#if cardTop.subtitle !== null}
        <h3 class="font-w-normal" style="opacity: .7">{cardTop.subtitle}</h3>
    {:else}
        <div style="width: 100%"><Loader type="h3"/></div>
        <div style="width: 100%"><Loader type="h3"/></div>
    {/if}

    <Br size="25"/>
    <p class="font-secondary flex flex-align-end">
        {#if cardTop.current_sum !== null}
            <span class="h1 font-w-500">{cardTop.currency} {cardTop.current_sum}</span>
        {:else}
            <div style="width: 50%"><Loader type="h1"/></div>
        {/if}

        <s />

        {#if cardTop.need_sum !== null}
            <span class="h3">/ {cardTop.currency} {cardTop.need_sum}</span>
        {:else}
            <div style="width: 30%; padding-bottom: 2px"><Loader type="h3"/></div>
        {/if}
    </p>
    <Br size="20"/>

    <Progress value={Math.floor(cardTop.current_sum / cardTop.need_sum * 100)}/>

    <Br size="40"/>
</Card>