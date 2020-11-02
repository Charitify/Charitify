<script>
    import { Br, Card, Progress, Loader } from '@components'

    export let cardTop = {
        name: null,
        description: null,
        current_sum: null,
        needed_sum: null,
    }
</script>

<Card class="container">
    <Br size="20"/>

    {#if cardTop.name !== null}
        <h2>{cardTop.name || ''}</h2>
    {:else}
        <div style="width: 80%"><Loader type="h2"/></div>
        <div style="width: 80%"><Loader type="h2"/></div>
    {/if}

    {#if cardTop.description !== null}
        <h3 class="font-w-normal" style="opacity: .7">{cardTop.description || ''}</h3>
    {:else}
        <div style="width: 100%"><Loader type="h3"/></div>
        <div style="width: 100%"><Loader type="h3"/></div>
    {/if}

    <Br size="25"/>
    <p class="font-secondary flex flex-align-baseline">
        {#if cardTop.current_sum !== null}
            <span class="h1 font-w-500">{cardTop.current_sum || 0}</span>
        {:else}
            <div style="width: 50%"><Loader type="h1"/></div>
        {/if}

        <s />

        {#if cardTop.needed_sum !== null}
            <span class="h3">/ {cardTop.needed_sum || 0} {cardTop.currency || 'грн'}</span>
        {:else}
            <div style="width: 30%; padding-bottom: 2px"><Loader type="h3"/></div>
        {/if}
    </p>
    <Br size="10"/>

    <Progress value={Math.floor((cardTop.current_sum  || 0) / (cardTop.needed_sum || 0) * 100)}/>

    <Br size="40"/>
</Card>