<script>
    const items = [
        {
            title: 'Comfort is the main feature',
            text: 'Just imaging, you do something simple and you can see the result of your short way.',
        },
        {
            title: 'Comfort is the main feature',
            text: 'Just imaging, you do something simple and you can see the result of your short way.',
        },
        {
            title: 'Comfort is the main feature',
            text: 'Just imaging, you do something simple and you can see the result of your short way.',
        },
        {
            title: 'Comfort is the main feature',
            text: 'Just imaging, you do something simple and you can see the result of your short way.',
        },
    ]
</script>

<ul>
    {#each items as item}
        <li>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <br>
        </li>
    {/each}
</ul>

<style>
    ul {
        list-style: disc outside none;
        padding: 0 calc(var(--screen-padding) * 5);
        /*list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='-1 -1 2 2'><circle r='1' /></svg>");*/
    }

    li {
        display: list-item;
    }

    ul, li, h3, p {
        max-width: 100%;
        vertical-align: middle;
    }

    h3, p {
        overflow: hidden;
        display: inline-block;
        word-break: break-word;
        text-overflow: ellipsis;
    }
</style>
