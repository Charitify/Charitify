<script>
    import { Icon, Button, Avatar } from '../components'

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

<nav class="theme-bg container">
    <ul>
        <li><a rel=prefetch href='.' class:selected='{segment === undefined}'>home</a></li>
        <li><a href='map' class:selected='{segment === "map"}'>map</a></li>
        <li><a rel=prefetch href='lists/charities' class:selected='{segment === "lists"}'>lists</a></li>
        <li><a rel=prefetch href='charity' class:selected='{segment === "charity"}'>charity</a></li>
        <li><a rel=prefetch href='organization' class:selected='{segment === "organization"}'>org</a></li>
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
                <Icon type="moon" class="theme-svg-fill"/>
            </Button>
        </li>

        <li>
            <Button on:click={changeTheme} auto size="small">
                <Avatar size="small" src="https://placeimg.com/300/300/people"/>
            </Button>
        </li>
    </ul>
</nav>

<style>
    nav {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        box-shadow: var(--shadow-secondary);
        border-bottom: 1px solid rgba(var(--color-danger), .1);
    }

    .selected {
        position: relative;
        display: inline-block;
    }

    .selected::after {
        position: absolute;
        content: "";
        width: calc(100% - 0.4em);
        height: 2px;
        background-color: rgb(var(--color-danger));
        display: block;
        bottom: -1px;
    }

    a {
        padding: 0.8em 0.2em;
    }

    .nav-actions {
        display: flex;
        align-items: center;
        margin: -3px;
    }

    .nav-actions li {
        padding: 3px;
    }

    .lang-select {
        padding: 5px;
        background-color: transparent;
    }

    .lang-select:hover,
    .lang-select:focus {
        box-shadow: none;
        background-color: rgba(var(--color-black), 0.1);
    }
</style>
