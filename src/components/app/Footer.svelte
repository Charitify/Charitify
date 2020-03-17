<script>
    import Button from '../Button.svelte'
</script>

<footer>
    <p>© {new Date().getFullYear()}</p>
    <ul>
        <li>
            <Button size="small" is="success">Action</Button>
        </li>
    </ul>
</footer>

<style>
    footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--screen-padding);
        box-shadow: inset var(--shadow-primary);
        background-color: rgba(var(--theme-bg-color));
    }

    ul {
        display: flex;
        margin: -3px;
    }

    li {
        padding: 3px;
    }
</style>
