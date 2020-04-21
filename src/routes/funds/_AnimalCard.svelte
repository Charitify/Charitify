<script>
    import { Card, Br, FancyBox, Avatar, Icon, Loader } from '@components'

    export let animal = {
        avatar: null,
        avatar2x: null,
        name: null,
        breed: null,
        age: null,
        sex: null,
        sterilization: null,
        characterShort: null,
        character: null,
        lifestory: null,
        vaccination: null,
    }
</script>

<style>
    table tr:not(:last-child) td {
        padding-bottom: 16px;
    }

    table td:last-child {
        font-weight: 300;
    }
</style>

<Card class="container">
    <Br size="30"/>

    <div class="flex flex-column flex-align-center">
        <span>
            <FancyBox>
                <Avatar src={animal.avatar} size="big" alt="Волтер"/>
                <section slot="box" class="flex full-width full-height" style="height: 100vw">
                    <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                        <Avatar src={animal.avatar} srcBig={animal.avatar2x} alt="Волтер"/>
                    </div>
                </section>
            </FancyBox>
        </span>

        <Br size="20"/>

        {#if animal.name !== null}
            <h2>{animal.name}</h2>
        {:else}
            <span style="width: 40%"><Loader type="h2"/></span>
        {/if}
        <Br size="5"/>
        {#if animal.breed !== null}
            <h3 class="font-w-500" style="opacity: .7">{animal.breed}</h3>
        {:else}
            <span style="width: 60%"><Loader type="h3"/></span>
        {/if}
    </div>
    <Br size="35"/>

    <section class="flex flex-justify-center">
        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em">
            <Icon type="polygon" is="primary"/>

            {#if animal.age !== null}
                <div class="text-white text-center absolute">
                    <h4 class="h1">{animal.age}</h4>
                    <h4 style="margin-top: -8px">Роки</h4>
                </div>
            {/if}
        </div>

        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em">
            <Icon type="polygon" is="info"/>

            {#if animal.sex !== null}
                <div class="absolute flex" style="width: 44px; height: 44px">
                {#if animal.sex === 'male'}
                    <Icon type="male" is="light"/>
                {:else if animal.sex === 'female'}
                    <Icon type="female" is="light"/>
                {/if}
                </div>
            {/if}
        </div>

        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em">
            <Icon type="polygon" is="primary"/>

            {#if animal.sterilization !== null}
                <div class="absolute flex flex-column flex-center">
                    {#if animal.sterilization}
                        <Icon type="checked-circle" is="light" size="big"/>
                    {:else}
                        <Icon type="cancel-circle" is="light" size="big"/>
                    {/if}
                    <span class="text-white text-center h5">Cтерилізація</span>
                </div>
            {/if}
        </div>
    </section>
    <Br size="40"/>

    <h2>Характер: {animal.characterShort ? animal.characterShort : ''}</h2>
    <Br size="10"/>

    {#if animal.character !== null}
        <p class="font-w-300">
            {animal.character}
        </p>
    {:else}
        <Loader type="p"/>
        <Loader type="p"/>
        <Loader type="p"/>
        <Loader type="p"/>
    {/if}
    <Br size="35"/>

    <h2>Життя</h2>
    <Br size="10"/>
    <table>
        <tbody>
            {#if animal.lifestory !== null}
                {#each animal.lifestory as item}
                    <tr>
                        <td>{item.date}</td>
                        <td>—</td>
                        <td>{item.title}</td>
                    </tr>
                {/each}
            {:else}
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
            {/if}
        </tbody>
    </table>
    <Br size="45"/>

    <h2>Вакцинації</h2>
    <Br size="15"/>
    <ul class="flex flex-column text-left">
        {#if animal.vaccination !== null}
            {#each animal.vaccination as item, i}
                <li>
                    {#if i}
                        <Br size="10"/>
                    {/if}
                    <span class="flex flex-align-center font-w-300">
                        {#if item.done}
                            <Icon is="primary" type="checked-circle" size="medium"/>
                        {:else}
                            <Icon is="danger" type="cancel-circle" size="medium"/>
                        {/if}
                        <s></s>
                        <s></s>
                        <s></s>
                        {item.title}
                    </span>
                </li>
            {/each}
        {:else}
            <li style="width: 40%">
                <Loader type="p"/>
            </li>
            <li style="width: 40%">
                <Br size="10"/>
                <Loader type="p"/>
            </li>
            <li style="width: 40%">
                <Br size="10"/>
                <Loader type="p"/>
            </li>
        {/if}
    </ul>

    <Br size="35"/>
</Card>