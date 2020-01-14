<script>
  import Icon from './Icon.svelte'
  import Button from './Button.svelte'

  export let segment;

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
		<li><a class:selected='{segment === undefined}' href='.'>home</a></li>
		<li><a class:selected='{segment === "about"}' href='about'>about</a></li>

		<!-- for the blog link, we're using rel=prefetch so that Sapper prefetches
		     the blog data when we hover over the link or tap it on a touchscreen -->
		<li><a rel=prefetch class:selected='{segment === "charity"}' href='charity'>charity</a></li>
	</ul>

  <span class="nav-actions">
    <select {value} name="lang" id="lang" class="btn small lang-select">
      <option value="ua">Ua</option>
      <option value="ru">Ru</option>
      <option value="en">En</option>
    </select>

    <Button on:click={changeTheme} auto size="small">
      <Icon type="moon" class="theme-svg-fill"/>
    </Button>
  </span>
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
    width: calc(100% - 1em);
    height: 2px;
    background-color: rgb(var(--color-danger));
    display: block;
    bottom: -1px;
  }

  a {
    padding: .8em 0.5em;
  }

  .nav-actions {
    display: flex;
    align-items: center;
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
