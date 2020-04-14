<script>
    import { Br } from '@components'

    export let title
    export let text
</script>

{#if title}
    <h2>{title}</h2>
{/if}
<Br size="10" />
<pre class="font-w-300">
    {text}
</pre>