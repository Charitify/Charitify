<script>
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import { Br, Footer, SearchLine } from '@components'
    import { ListNavigation, OwnSwitcher } from './components'

    export let segment

    const title1ByParam = {
        true: 'Мої',
        false: 'Всі',
    }

    const title2ByParam = {
        funds: 'Фонди',
        organizations: 'Організації',
    }

    let isOwnList = false
</script>

<main class="theme-bg-color-secondary">
    <section class="filters theme-bg container shadow-secondary relative">
        <Br size="var(--header-height)"/>
        <Br size="20"/>
        <SearchLine/>
        <Br size="var(--screen-padding)"/>
        <ListNavigation {segment}/>
        <Br size="var(--screen-padding)"/>
        <div class="flex flex-justify-center">
            <OwnSwitcher bind:enabled={isOwnList} style="width: 250px"/>
        </div>
        <Br size="var(--screen-padding)"/>
    </section>

    <div class="container overflow-hidden">
        <Br size="var(--screen-padding)"/>
        <h2>{title1ByParam[isOwnList.toString()]} {title2ByParam[segment]}</h2>
        <br>

        <slot></slot>

        <br>
        <br>
    </div>
</main>

<style>
    .filters {
        position: sticky;
        top: 0;
        z-index: 2;
        transition: .2s ease-in-out;
        transform: none;
        border-radius: var(--border-radius-big) var(--border-radius-big);
    }

    :global(body.header-inactive) .filters {
        transform: translateY(calc(var(--header-height) * -1));
    }

</style>
