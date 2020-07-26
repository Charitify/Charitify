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
            <li>
                <a
                        rel=prefetch
                        href={navItem.href}
                        class:selected='{segment === navItem.segment}'
                >
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
    nav ul, nav li {
        display: flex;
        align-self: stretch;
        align-items: stretch;
        justify-content: stretch;
    }

    li {
        flex: 1 1 0;
    }

    li a {
        flex: 1 1 0;
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px 10px;
    }

    li a:hover, li a.selected {
        background-color: rgba(var(--color-black), .1);
    }
</style>
