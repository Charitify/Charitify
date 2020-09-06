<script>
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import { Br, Footer, SearchLine } from '@components'
    import { ListNavigation, OwnSwitcher } from './components'

    export let segment

    const titleByParam = {
        funds: 'Фонди',
        organizations: 'Організації',
    }

    let isOwnList = false

    const gap = 5
    let isHeaderVisible = true
    let onScroll = null
    let lastY = 0
    $: classProp = classnames('container top-block', { active: isHeaderVisible })
    onMount(() => {
        onScroll = (e) => requestAnimationFrame(function() {
            const currentY = e.target.scrollTop;
            const direction = currentY - lastY
            if (currentY < 5) { // up (50 - max scrollTop for displaying header)
                if (!isHeaderVisible) isHeaderVisible = true
                lastY = currentY + gap;
            } else if (direction > gap) { // down
                if (isHeaderVisible) isHeaderVisible = false
                lastY = currentY - gap;
            }
        })
    })

    $: console.log(isOwnList)
</script>

<main class="layout list-layout theme-bg-color-secondary">
    <section class="theme-bg container shadow-secondary relative">
        <Br size="var(--header-height)"/>
        <Br size="20"/>
        <SearchLine/>
        <Br size="var(--screen-padding)"/>
        <ListNavigation {segment}/>
        <Br size="var(--screen-padding)"/>
        <div style="padding: 0 30px">
            <OwnSwitcher bind:enabled={isOwnList}/>
        </div>
        <Br size="var(--screen-padding)"/>
    </section>

    <div class="list-wrap" on:scroll={onScroll}>
        <Br size="var(--screen-padding)"/>
        <h2>Мої {titleByParam[segment]}</h2>
        <br>

        <slot></slot>

        <br>
        <br>
    </div>
</main>

<style>
    .top-block {
        overflow: hidden;
        max-height: 100px;
        transition-duration: .4s;
        transition-timing-function: cubic-bezier(0.5, 1, 0.5, 1);
    }

    .top-block.active {
        max-height: 100vh;
        transition-timing-function: cubic-bezier(1, 0.5, 1, 0.5);
    }

    .list-wrap {
        flex: 1 1 0;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0 var(--screen-padding);
    }
</style>
