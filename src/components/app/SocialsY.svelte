
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

<ul class="social-icons">
    {#each list as item}
        <li>
            {#if item !== null}
                <slot {item}>
                    {#if item.href}
                        <a href={item.href} target="_blank" class="inner" title={item.title}>
                            <span class="icon-wrap">
                                <Icon type={item.type} is="light" size="tiny"/>
                            </span>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="h3">{item.title}</p>
                        </a>
                    {:else}
                        <div on:click class="inner" title={item.title}>
                            <span class="icon-wrap">
                                <Icon type={item.type} is="light" size="tiny"/>
                            </span>
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

<style>
    .social-icons li {
        display: flex;
        align-items: center;
        overflow: hidden;
        margin: 7px 0;
    }

    .social-icons .inner {
        display: flex;
        align-items: center;
    }

    .social-icons .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: rgba(var(--color-dark));
    }
</style>
