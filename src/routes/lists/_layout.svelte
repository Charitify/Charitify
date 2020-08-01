<script>
    import { Br, Footer, SearchLine } from '@components'
    import { ListNavigation } from './components'

    export let segment
</script>

<main class="layout list-layout theme-bg-color-secondary">
    <section class="theme-bg container shadow-secondary">
        <Br size="var(--header-height)"/>

        <Br size="20"/>
        <SearchLine/>
        <Br size="20"/>
    </section>

    <section class="container">
        <Br size="30"/>
        <ListNavigation {segment}/>

        <section>
            <Br size="30"/>

        </section>
    </section>

    <Br size="60"/>
    <h2>Мої фонди</h2>

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
</style>
