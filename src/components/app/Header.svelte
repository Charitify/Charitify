<script>
    import Icon from '../Icon.svelte'
    import Button from '../Button.svelte'
    import Avatar from '../Avatar.svelte'

    export let segment

    let isDarkTheme = false

    let value = 'ua'

    function changeTheme() {
        isDarkTheme = !isDarkTheme
        document.body.classList.remove('theme-dark')
        document.body.classList.remove('theme-light')
        document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')
    }
</script>

<nav class="container">
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
        position: sticky;
        top: 0;
        height: 50px;
        z-index: 10;
        display: flex;
        align-items: center;
        color: rgba(var(--color-font-light));
        justify-content: space-between;
        box-shadow: var(--shadow-secondary);
        border-bottom: 1px solid rgba(var(--color-danger), .1);
        background-color: rgba(var(--color-dark-second));
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
