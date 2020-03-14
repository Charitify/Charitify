<script>
    import { Button } from '../components'
</script>

<ul class="active font-secondary">
    <li>
        <Button is="success" size="medium" on:click="{e => alert('Дякую! 🥰')}">Допомогти</Button>
    </li>
    <li style="flex: none">
        <s></s>
        <s></s>
        <s></s>
    </li>
    <li>
        <Button is="warning" size="medium" on:click="{e => alert('Дякую! 🥰')}">Поділитись</Button>
    </li>
</ul>

<style>
    ul {
        position: fixed;
        top: 50px;
        left: 0;
        width: 100%;
        flex: 0;
        display: flex;
        z-index: 9;
        padding: var(--screen-padding);
        transition: .3s ease-in-out;
        background-color: rgba(var(--theme-bg-color));
        box-shadow: var(--shadow-primary);
    }

    li {
        flex: 1 1 0;
    }
</style>
