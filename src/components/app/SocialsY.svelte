
<script>
    import Icon from '../Icon.svelte'
    import Loader from '../Loader/Loader.svelte'
    import { icons } from '../../config'

    /**
     * @type {{
     *  href: string,
     *  title: string,
     *  type: Config.Icons,
     * }[]}
     */
    export let items

    $: list = items === null ? [null, null, null] : items || []
</script>

<ul>
    {#each list as item}
        <li>
            {#if item !== null}
                <slot {item}>
                    {#if item.href}
                        <a href={item.href} class="flex flex-align-center" style="padding: 7px 0" title={item.title}>
                            <Icon type={icons[item.type]} size="medium"/>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="h3">{item.title}</p>
                        </a>
                    {:else}
                        <div on:click class="flex flex-align-center" style="padding: 7px 0">
                            <Icon type={icons[item.type]} size="medium"/>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="h3">{item.title}</p>
                        </div>
                    {/if}
                </slot>
            {:else}
                <span class="flex flex-align-center" style="padding: 7px 0">
                    <Loader type="h3"/>
                </span>
            {/if}
        </li>
    {/each}
</ul>
