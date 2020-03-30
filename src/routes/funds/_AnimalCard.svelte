<script>
    import { Card, Br, FancyBox, Avatar, Icon } from '@components'

    export let animal = {}
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

        <h2>{animal.name}</h2>
        <Br size="5"/>
        <h3 class="font-w-500" style="opacity: .7">{animal.breed}</h3>
    </div>
    <Br size="35"/>

    <section class="flex flex-justify-center">
        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em">
            <Icon type="polygon" is="primary"/>
            <div class="text-white text-center absolute">
                <h4 class="h1">{animal.age}</h4>
                <h4 style="margin-top: -8px">Роки</h4>
            </div>
        </div>

        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em">
            <Icon type="polygon" is="info"/>
            <div class="absolute flex" style="width: 44px; height: 44px">
            {#if animal.sex === 'male'}
                <Icon type="male" is="light"/>
            {:else if animal.sex === 'female'}
                <Icon type="female" is="light"/>
            {/if}
            </div>
        </div>

        <div class="flex flex-center relative" style="width: 90px; height: 90px; margin: 0 .8em; opacity: .3">
            <Icon type="polygon" is="primary"/>
            <div class="absolute flex flex-column flex-center">
                <Icon type="cancel-circle" is="light" size="big"/>
                <span class="text-white text-center h5">Cтерилізація</span>
            </div>
        </div>
    </section>
    <Br size="40"/>

    <h2>Характер Волтера: 😃</h2>
    <Br size="10"/>
    <p class="font-w-300">
        {animal.character}
    </p>
    <Br size="35"/>

    <h2>Життя Волтера</h2>
    <Br size="10"/>
    <table>
        <tbody>
        <tr>
            <td>01.02.2019</td>
            <td>—</td>
            <td>Його перший день народження</td>
        </tr>
        <tr>
            <td>05.02.2019</td>
            <td>—</td>
            <td>Ми приютили його з вулиці</td>
        </tr>
        <tr>
            <td>07.03.2019</td>
            <td>—</td>
            <td>Зробили вакцинацію проти бліх</td>
        </tr>
        <tr>
            <td>23.06.2019</td>
            <td>—</td>
            <td>Знайшов для себе улюблену іграшку</td>
        </tr>
        </tbody>
    </table>
    <Br size="45"/>

    <h2>Вакцинації</h2>
    <Br size="15"/>
    <ul class="flex flex-column text-left">
        <li>
            <span class="flex flex-align-center font-w-300">
                <Icon is="primary" type="checked-circle" size="medium"/>
                <s></s>
                <s></s>
                <s></s>
                Від бліх
            </span>
        </li>
        <li>
            <Br size="10"/>
            <span class="flex flex-align-center font-w-300">
                <Icon is="primary" type="checked-circle" size="medium"/>
                <s></s>
                <s></s>
                <s></s>
                Від паразитів
            </span>
        </li>
        <li>
            <Br size="10"/>
            <span class="flex flex-align-center font-w-300">
                <Icon is="danger" type="cancel-circle" size="medium"/>
                <s></s>
                <s></s>
                <s></s>
                Від грибків
            </span>
        </li>
    </ul>

    <Br size="35"/>
</Card>