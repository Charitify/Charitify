<script>
    import { SearchLine, ListItems } from '../layouts'
</script>

<svelte:head>
    <title>Charitify - is the application for helping those in need.</title>
</svelte:head>


<div class="search theme-bg container">
    <br>

    <SearchLine/>

    <br>
</div>

<div class="container">
    <br>

    <ListItems amount="20"/>

    <br>
    <br>
</div>

<style>
    .search {
        position: sticky;
        top: 47px;
        box-shadow: var(--shadow-primary);
    }
</style>
