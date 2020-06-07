<script>
    import { Br, Loader } from '@components'

    export let title
    export let text
</script>

{#if title}
    <h2>{title}</h2>
{:else}
    <div style="width: 85%"><Loader type="h2"/>  </div>
{/if}
<Br size="10" />

{#if text}
<pre class="font-w-300">
    {text}
</pre>
{:else}
    <Loader type="pre"/>  
    <Loader type="pre"/>  
    <Loader type="pre"/>  
    <div style="width: 60%"><Loader type="pre"/></div>
{/if}