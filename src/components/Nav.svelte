<script>
  export let segment;

  let isDarkTheme = true

  function changeTheme() {
    isDarkTheme = !isDarkTheme
    document.body.classList.remove('theme-dark')
    document.body.classList.remove('theme-light')
    document.body.classList.add(isDarkTheme ? 'theme-dark' : 'theme-light')
  }
</script>

<nav class="theme-bg">
	<ul>
		<li><a class:selected='{segment === undefined}' href='.'>home</a></li>
		<li><a class:selected='{segment === "about"}' href='about'>about</a></li>

		<!-- for the blog link, we're using rel=prefetch so that Sapper prefetches
		     the blog data when we hover over the link or tap it on a touchscreen -->
		<li><a rel=prefetch class:selected='{segment === "blog"}' href='blog'>blog</a></li>
	</ul>

  <button type="button" on:click={changeTheme}>
    Switch theme
  </button>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgba(var(--color-danger), .1);
    padding: 0 1em;
    z-index: 1;
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
    padding: 1em 0.5em;
  }
</style>
