<script>
    import { Input, Button } from '../components'
</script>

<ul>
    <li>
        <Button is="success" on:click="{e => console.log(e)}">50</Button>
    </li>
    <li>
        <Button is="success" on:click="{e => console.log(e)}">100</Button>
    </li>
    <li>
        <Button is="success" on:click="{e => console.log(e)}">200</Button>
    </li>
    <li>
        <br>
        <Input
                type="number"
                name="num"
                list="sum-suggestions"
                placeholder="Num"
                autoselect
                align="right"
                value="1000"
        />

        <datalist id="sum-suggestions">
            <option value="20">
            <option value="500">
            <option value="1000">
        </datalist>
    </li>
    <li>
        <Button is="warning" on:click="{e => console.log(e)}">Donate</Button>
    </li>
</ul>

<style>
    ul {
        flex: 0;
        display: flex;
        flex-direction: column;
        margin: calc(var(--screen-padding) * -1 / 2) 0;
        padding: 0 0 0 var(--screen-padding);
    }

    ul li {
        flex: none;
        margin: calc(var(--screen-padding) / 2) 0;
    }
</style>
