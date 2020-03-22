<script>
    import { onMount } from 'svelte'
    import { classnames } from '@utils'
    import Icon from '@components/Icon.svelte'
    import Button from '@components/Button.svelte'
    import Avatar from '@components/Avatar.svelte'

    export let segment

    let value = 'ua'

    let isHeaderVisible = true
    let onScroll = null
    let lastY = 0
    $: classProp = classnames('container', { active: isHeaderVisible })
    onMount(() => {
        onScroll = (e) => requestAnimationFrame(function() {
            const currentY = e.touches ? e.touches[0].clientY : 0;
            const deltaY = e.deltaY || (lastY - currentY)
            if (deltaY < 0 && !isHeaderVisible || deltaY > 0 && isHeaderVisible) {
                isHeaderVisible = !isHeaderVisible
            }
            lastY = currentY
        })
    })

    let isDarkTheme = false
    function changeTheme() {
        isDarkTheme = !isDarkTheme
        document.body.classList.remove('theme-dark')
        document.body.classList.remove('theme-light')
        document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')
    }
</script>

<svelte:window on:touchmove={onScroll} on:wheel={onScroll}/>
<nav class={classProp}>
    <ul class="nav-pages flex">
        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>
        <li><a rel=prefetch href='lists/funds' class:selected='{segment === "lists"}'>lists</a></li>
        <li><a href='map' class:selected='{segment === "map"}'>map</a></li>
    </ul>

    <ul class="nav-actions">
        <li>
            <select {value} name="lang" id="lang" class="btn small lang-select">
                <option value="ua">Ua</option>
                <option value="ru">Ru</option>
                <option value="en">En</option>
            </select>
        </li>

        <li>
            <Button on:click={changeTheme} auto size="small">
                <Icon type="moon" size="medium" class="theme-svg-fill-opposite" is="light"/>
            </Button>
        </li>

        <li>
            <a class="btn small" href="users/me">
                <Avatar size="small" src="https://placeimg.com/30/30/people" alt="avatar"/>
            </a>
        </li>
    </ul>
</nav>

<style>
    nav {
        position: relative;
        top: 0;
        width: 100%;
        height: 50px;
        z-index: 10;
        display: flex;
        align-items: center;
        margin-top: -50px;
        transition: .2s ease-in-out;
        color: rgba(var(--color-font-light));
        justify-content: space-between;
        box-shadow: var(--shadow-secondary);
        border-bottom: 1px solid rgba(var(--color-danger), .1);
        background-color: rgba(var(--color-dark-second));
    }

    nav.active {
        margin-top: 0;
    }

    .selected {
        position: relative;
        display: inline-block;
    }

    .selected::after {
        position: absolute;
        content: "";
        width: calc(100% - 1em);
        height: 2px;
        background-color: rgb(var(--color-danger));
        display: block;
        bottom: -1px;
    }

    .nav-pages a {
        padding: 0.8em 0.5em;
    }

    .nav-actions {
        display: flex;
        align-items: center;
        margin: -3px;
    }

    .nav-actions li {
        padding: 3px;
    }

    .nav-actions a {
        display: block;
    }

    .lang-select {
        padding: 5px;
        background-color: transparent;
        color: rgba(var(--color-font-light));
    }

    .lang-select:hover,
    .lang-select:focus {
        box-shadow: none;
        background-color: rgba(var(--color-black), 0.1);
    }
</style>
