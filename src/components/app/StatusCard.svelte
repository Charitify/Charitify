<script>
    import Br from '../Br.svelte'
    import Card from '../Card.svelte'
    import Button from '../Button.svelte'
    import Picture from '../Picture.svelte'

    export let src
    export let status
    export let text
</script>

<Card class="container flex flex-column flex-align-center text-center">
    <Br size="20"/>
    {#if src}
        <Picture {src} alt="Illustration" size="contain" bg={false}/>
        <Br size="40"/>
    {/if}
    {#if status}
        <h1>{status}</h1>
        <Br size="medium"/>
    {/if}
    {#if text}
        <p class="h3 font-secondary">{text}</p>
        <Br size="50"/>
    {/if}
    <slot/>
    <Br size="40"/>
</Card>