<script>
    import Icon from '../Icon.svelte'
    import Loader from '../Loader/Loader.svelte'

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
            <li class={item.type}>
                <slot {item}>
                    {#if item.href}
                        <a href={item.href} target="_blank" title={item.title}>
                            <Icon type={item.type} size="medium"/>
                        </a>
                    {:else}
                        <span on:click>
                            <Icon type={item.type} size="medium"/>
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
    .social-icons li {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 10px;
    }

    .social-icons .telegram {
        background-color: #2197D2;
    }
    .social-icons .facebook {
        background-color: #4267B2;
    }
    .social-icons .viber {
        background-color: #665CAC;
    }
</style>
