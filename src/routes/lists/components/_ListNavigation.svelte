<script>
    import ListNavigationItem from './_ListNavigationItem.svelte'

    export let segment

    const nav = [
        {
            segment: 'funds',
            href: 'lists/funds',
            label: 'Фонди',
        },
        {
            segment: 'organizations',
            href: 'lists/organizations',
            label: 'Оргранізації',
        }
    ]
</script>

<nav>
    <ul>
        {#each nav as navItem}
            <li class="radius-big overflow-hidden">
                <a rel=prefetch href={navItem.href}>
                    <ListNavigationItem
                        active='{segment === navItem.segment}'
                        value={navItem.label}
                    />
                </a>
            </li>
        {/each}
    </ul>
</nav>

<style>
    nav ul {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        grid-template-rows: 1fr;
        grid-gap: 10px;
        align-items: stretch;
        justify-content: stretch;
        height: 40px;
    }

    nav li, nav li a {
        flex-grow: 1;
        display: flex;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
        overflow: hidden;
    }

    li a:hover {
        background-color: rgba(var(--color-black), .1);
    }
</style>
