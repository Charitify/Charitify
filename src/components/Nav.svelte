<script>
  import Icon from './Icon.svelte'
  import Button from './Button.svelte'

  export let segment;

  let isDarkTheme = true

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
		<li><a rel=prefetch class:selected='{segment === "blog"}' href='blog'>blog</a></li>
	</ul>

  <span class="nav-actions">
    <select {value} name="lang" id="lang" class="btn small lang-select">
      <option value="ua">Ua</option>
      <option value="ru">Ru</option>
      <option value="en">En</option>
    </select>

    <Button on:click={changeTheme} auto size="small">
      <Icon type="moon" class="theme-fill-color"/>
    </Button>
  </span>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgba(var(--color-danger), .1);
    box-shadow: var(--secondary-shadow);
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
    background-color: rgba(0, 0, 0, 0.1);
  }
</style>
