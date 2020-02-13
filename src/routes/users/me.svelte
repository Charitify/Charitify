<script>
    import { Input, Picture, Button, Space } from '../../components'

    const inputs = [
        {
            placeholder: 'username',
        },
        {
            placeholder: 'Full name',
        },
        {
            placeholder: 'sex (checkboxes or dropdown)',
        },
        {
            placeholder: 'birth',
        },
        {
            placeholder: 'email',
        },
        {
            placeholder: 'tel',
        },
        {
            placeholder: 'location (autocomplete)',
        },
    ]
</script>

<section class="container">
    <br>
    <div class="user-avatar">
        <Picture src="https://placeimg.com/100/100/people" alt="user avatar"/>
    </div>
    <br>
    <br>
    <section style="display: flex; flex-direction: row">
        <Button is="success" auto>success</Button>
        <Space size="2"/>
        <Button is="warning" auto>warning</Button>
        <Space size="2"/>
        <Button is="danger" auto>danger</Button>
        <Space size="2"/>
        <Button is="info" auto>info</Button>
    </section>
    <br>
    <br>
    <ul>
        {#each inputs as inp}
            <li>
                <Input {...inp}/>
            </li>
        {/each}
    </ul>
</section>

<style>
    section {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    ul {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin: 0 -5px;
    }

    li {
        flex: 1 1 50%;
        padding: 5px;
    }

    .user-avatar {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: var(--shadow-primary);
        background-color: rgba(var(--theme-bg-color));
    }
</style>
