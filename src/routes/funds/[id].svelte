<script>
    import { stores } from '@sapper/app'
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import { classnames } from '../../utils'
    import {
        Footer,
        Comments,
        Documents,
        TrustButton,
        DonatorsList,
    } from '../../layouts'
    import {
        Icon,
        Card,
        Avatar,
        Button,
        Picture,
        Progress,
        Carousel,
    } from '../../components'

    const { page } = stores()
    let charityId = $page.params.id

    // Entity
    let charity = {}
    $: carousel = (charity.avatars || []).map(p => ({ src: p, alt: 'photo' }))
    onMount(async () => {
        charity = await api.getFund(1)
    })

    // Trust button
    let active = false
    async function onClick() {
        active = !active
    }

    // Donate button
    let activeDonateBtn = false
    onMount(() => setTimeout(() => activeDonateBtn = true, 500))
    $: classPropDonateBtn = classnames('donate-btn', { active: activeDonateBtn })
    function onDonate() {
        alert('Дякую! 🥰')
    }
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
    table tr:not(:last-child) td {
        padding-bottom: 16px;
    }

    table td:last-child {
        font-weight: 300;
    }

    .donate-btn {
        position: fixed;
        left: 0;
        bottom: -1px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-weight: 600;
        font-size: 1.85em;
        line-height: 1.26;
        color: rgba(var(--color-white));
        padding: 20px;
        text-align: center;
        transition: .3s ease-in-out;
        transform: translateY(100%);
        background-color: rgba(var(--color-success));
    }

    .donate-btn.active {
        transform: none
    }
</style>

<section class="container scroll-box theme-bg-color-secondary">

    <br>
    <br>

    <section class="flex" style="height: 200px">
        <Carousel items={carousel}/>
    </section>

    <br>

    <Button class="white">
        <div class="flex flex-align-center flex-justify-start full-width">
            <s></s>
            <div class="flex" style="max-width: 45px; height: 40px; overflow: hidden">
                <Picture
                        src="./assets/dimsirka.jpg"
                        size="contain"
                        alt="logo"
                />
            </div>
            <s></s>
            <s></s>
            <s></s>
            <h3>"Дім Сірка"</h3>
        </div>
    </Button>

    <br>

    <Card class="container">
        <br>
        <br class="small">

        <h2>Збережемо тварин разом</h2>
        <br class="small">
        <h3 class="font-w-normal" style="color: rgba(var(--color-black), .7)">Збір грошей на допомогу безпритульним
            тваринам</h3>

        <br>
        <br class="small">

        <p class="font-secondary">
            <span class="h1">3500грн</span>
            <span class="h3"> / 20000грн</span>
        </p>

        <br>

        <Progress value={Math.floor(3500
        / 20000 * 100)}/>

        <br class="big">
    </Card>

    <br class="small">
    <br>

    <p class="container flex flex-justify-between flex-align-center">
        <span class="flex flex-align-center">
            <Icon is="danger" type="heart-filled" size="medium"/>
            <s></s>
            <s></s>
            <span class="font-secondary font-w-600 h3">1</span>
        </span>
        <span class="flex flex-align-center">
            <Icon is="dark" type="eye" size="medium"/>
            <s></s>
            <s></s>
            <span class="font-secondary font-w-600 h3">13</span>
        </span>
    </p>

    <br class="big">

    <h2>Збережемо тварин разом</h2>
    <br class="small">
    <pre class="font-w-300">
        Терміново шукаємо добрі руки 🤲🥰
        Бадді підкинули під кафе біля самої траси!
        Біля нього були тільки залишки черствого хліба... 💔
        За що можна було покинути малюка напризволяще? 🥺
        В чому він міг провинитися? Йому всього 2 місяці.
        Зараз буде проходити обробку від паразитів та вакцинацію 💉
    </pre>

    <br class="small">

    <p class="flex">
    <Button class="flex flex-align-center" auto size="small">
        <Icon is="dark" type="share" size="medium"/>
        <s></s>
        <s></s>
        <p class="font-w-500">Поділитись</p>
    </Button>
    <s></s>
    <s></s>
    <s></s>
    <s></s>
    <s></s>
    <Button class="flex flex-align-center" auto size="small">
        <Icon is="dark" type="link" size="medium"/>
        <s></s>
        <s></s>
        <p class="font-w-500">Скопіювати</p>
    </Button>
    </p>

    <br>
    <br>
    <br>

    <section class="flex flex-column flex-align-center flex-justify-center">
        <div style="width: 100px; max-width: 100%">
            <TrustButton isActive={active} on:click={onClick}/>
        </div>
        <br class="small">
        <h2>Я Довіряю</h2>
    </section>

    <br>
    <br>
    <br>
    <br>

    <Card class="container">
        <br class="big">

        <div class="flex flex-column flex-align-center">
            <Avatar src="https://placeimg.com/300/300/animal" size="big" alt="Волтер"/>

            <br class="tiny">
            <br>

            <h2>Волтер</h2>
            <br class="tiny">
            <h4 class="font-w-500">Jack Russell Terrier</h4>
        </div>

        <br class="big">

        <section class="flex flex-justify-between">
            <div class="flex flex-center relative" style="width: 90px; height: 90px">
                <Icon type="polygon" is="primary"/>
                <div class="text-white text-center absolute">
                    <h4 class="h1">3</h4>
                    <h4 style="margin-top: -8px">Роки</h4>
                </div>
            </div>

            <div class="flex flex-center relative" style="width: 90px; height: 90px">
                <Icon type="polygon" is="info"/>
                <div class="absolute flex" style="width: 44px; height: 44px">
                    <Icon type="male" is="light"/>
                </div>
            </div>

            <div class="flex flex-center relative" style="width: 90px; height: 90px; opacity: .3">
                <Icon type="polygon" is="primary"/>
                <div class="absolute flex flex-column flex-center">
                    <Icon type="cancel-circle" is="light" size="big"/>
                    <span class="text-white text-center h5">Cтерилізація</span>
                </div>
            </div>
        </section>

        <br class="big">
        <br class="small">

        <h2>Характер Волтера: 😃</h2>
        <br class="small">
        <p class="font-w-300">
            Дуже грайливий і милий песик. Любить проводити час з іншими собаками, дуже любить гратись з дітьми
        </p>

        <br class="big">

        <h2>Життя Волтера</h2>
        <br class="small">
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

        <br>
        <br>
        <br>

        <h2>Вакцинації</h2>
        <br>
        <ul class="flex flex-column text-left">
            <li>
                <span class="flex flex-align-center font-w-300">
                    <Icon is="primary" type="checked-circle" size="small"/>
                    <s></s>
                    <s></s>
                    Від бліх
                </span>
            </li>
            <li>
                <br>
                <span class="flex flex-align-center font-w-300">
                    <Icon is="primary" type="checked-circle" size="small"/>
                    <s></s>
                    <s></s>
                    Від паразитів
                </span>
            </li>
            <li>
                <br>
                <span class="flex flex-align-center font-w-300">
                    <Icon is="danger" type="cancel-circle" size="small"/>
                    <s></s>
                    <s></s>
                    Від грибків
                </span>
            </li>
        </ul>

        <br class="big">
    </Card>

    <br class="big">
    <br class="big">

    <h2>Наші піклувальники</h2>
    <br class="small">
    <div class="full-container">
        <DonatorsList/>
    </div>

    <br class="big">
    <br class="big">

    <h2>Документи</h2>
    <div class="full-container">
        <Documents/>
    </div>

    <br class="big">
    <br class="big">

    <h2>Відео про Волтера</h2>
    <br>
    <section class="flex" style="height: 200px">
        <Carousel items={carousel}/>
    </section>

    <br class="big">
    <br class="big">

    <h2>Контакти</h2>
    <br>
    <ul style="list-style: disc outside none; padding-left: var(--screen-padding)" class="h3 font-w-500 font-secondary">
        <li style="padding-bottom: 4px">Ви пожете купити йому поїсти</li>
        <li style="padding-bottom: 4px">Можете особисто відвідати його у нас</li>
        <li style="padding-bottom: 4px">Купити вакцінацію для Волтера</li>
        <li style="padding-bottom: 4px">Допомогти любим інщим способом</li>
    </ul>
    <br class="big">
    <div class="flex">
        <div class="flex flex-align-center font-secondary">
            <Icon size="medium" is="dark" type="phone"/>
            <s></s>
            <s></s>
            <h2>+38 (093) 205-43-92</h2>
        </div>
    </div>
    <br class="small">
    <p class="font-w-300">Подзвоніть нам, якщо хочете допомогти Волтеру</p>

    <br class="big">
    <br class="big">

    <h2>Коментарі</h2>
    <br class="small">
    <div class="full-container">
        <Comments/>
    </div>

    <br class="big">
    <br class="big">
    <br class="big">

    <div class="full-container">
        <Footer/>
    </div>
</section>

<button type="button" class={classPropDonateBtn} on:click={onDonate}>
    <Icon type="coin" size="big" is="light"/>
    <s></s>
    <s></s>
    Допомогти
</button>

