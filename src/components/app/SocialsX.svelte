<script>
    import Icon from '../Icon.svelte'
    import Loader from '../Loader/Loader.svelte'
    import { icons } from '../../config/index.js'

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

<ul class="flex flex-justify-center social-icons">
    {#each list as item}
        {#if item !== null}
            <li style="padding: 0 10px" class={item.type}>
                <slot {item}>
                    {#if item.href}
                        <a href={item.href} target="_blank" title={item.title}>
                            <Icon type={item.type} size="large" class="custom"/>
                        </a>
                    {:else}
                        <span on:click>
                            <Icon type={item.type} size="large" class="custom"/>
                        </span>
                    {/if}
                </slot>
            </li>
        {:else}
            <li style="padding: 0 10px; width: 60px; height: 45px; overflow: hidden">
                <Loader type="avatar"/>
            </li>
        {/if}
    {/each}
</ul>

<style>
    .social-icons .telegram * {
        fill: #2197D2;
    }
    .social-icons .facebook * {
        fill: #4267B2;
    }
    .social-icons .viber * {
        fill: #665CAC;
    }
</style>
