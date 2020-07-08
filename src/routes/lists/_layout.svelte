<script>
    import { Br, Footer, SearchLine } from '@components'

    export let segment
</script>

<main class="layout list-layout theme-bg-color-secondary">
    <section class="theme-bg container shadow-secondary">
        <Br size="var(--header-height)"/>

        <div class="overflow-hidden"><Br size="20"/></div>
        <SearchLine/>
        <div class="overflow-hidden"><Br size="20"/></div>
    </section>

    <nav>
        <ul>
            <li><a rel=prefetch href='lists/funds' class:selected='{segment === "charities"}'>funds</a></li>
            <li><a rel=prefetch href='lists/organizations' class:selected='{segment === "organizations"}'>organizations</a></li>
        </ul>
    </nav>

    <div class="list-wrap">
        <br>

        <slot></slot>

        <br>
        <br>
    </div>

    <Footer/>
</main>

<style>
    .list-wrap {
        flex: 1 1 0;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0 var(--screen-padding);
    }

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
