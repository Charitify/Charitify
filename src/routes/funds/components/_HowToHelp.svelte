<script>
    import { Br, Icon, Loader } from '@components'

    export let data = {
        phone: null,
        how_to_help: null,
    }
</script>

<h1>Як допомогти</h1>
<Br size="15"/>
<ul style="list-style: disc outside none; padding-left: var(--screen-padding)" class="h3 font-w-500 font-secondary">
    {#if data.how_to_help !== null}
        {#if typeof data.how_to_help === 'string'}
            {#each data.how_to_help.split(/\n?• /).filter(Boolean) as line}
                <li style="padding-bottom: 5px">{line}</li>
            {/each}
        {/if}
    {:else}
        <li style="padding-bottom: 5px">
            <span class="font-secondary font-w-500 p relative">
                <span style="visibility: hidden">Допомогти любим способом</span>
                <Loader type="h3" absolute/>
            </span>  
        </li>
       <li style="padding-bottom: 5px">
            <span class="font-secondary font-w-500 p relative">
                <span style="visibility: hidden">Допомогти любим способом</span>
                <Loader type="h3" absolute/>
            </span>  
        </li>
       <li style="padding-bottom: 5px">
            <span class="font-secondary font-w-500 p relative">
                <span style="visibility: hidden">Допомогти любим способом</span>
                <Loader type="h3" absolute/>
            </span>
        </li>
       <li style="padding-bottom: 5px">
            <span class="font-secondary font-w-500 p relative">
                <span style="visibility: hidden">Допомогти любим способом</span>
                <Loader type="h3" absolute/>
            </span>  
        </li>
    {/if}
</ul>
<Br size="30"/>
<div class="flex">
    <div class="flex flex-align-center font-secondary">
        <Icon size="medium" type="phone" class="theme-svg-fill-opposite"/>
        <s></s>
        <s></s>
        {#if data.phone !== null}
            <h2>{data.phone}</h2>
        {:else}
            <span style="width: 240px"><Loader type="h2"/></span>
        {/if}
    </div>
</div>
<Br size="5"/>
<p class="font-w-300">Подзвоніть нам, допоможемо разом!</p>
