<script>
    import { Card, Avatar } from '../components'

    export let items
</script>

{#if Array.isArray(items) && items.length}
    <Card>
        <ul>
            {#each items as item}
                {#if item.title && item.src}
                    <li>
                        <Avatar src={item.src} size="medium"/>
                        <s></s>
                        <s></s>
                        <s></s>
                        <s></s>
                        <div>
                            <p class="h1 text-ellipsis">{ item.title }</p>
                            <span class="h5 text-ellipsis">{ item.subtitle }<span/>
                        </div>
                    </li>
                {/if}
            {/each}
        </ul>
    </Card>
{/if}

<style>
    ul {
        width: 100%
    }

    li {
        display: flex;
        align-items: center;
        padding: 20px;
        width: 100%;
    }

    li:not(:last-child) {
        border-bottom: 1px dashed rgba(var(--color-black), 0.1);
    }

    div {
        overflow: hidden;
    }

    p {
        font-weight: 600;
    }

    span {
        font-weight: 300;
    }
</style>
