<script>
    import { stores } from '@sapper/app';
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import {
        Icon,
        Card,
        Avatar,
        Button,
        Footer,
        Picture,
        Progress,
        Comments,
        Carousel,
        FancyBox,
        Documents,
        TrustButton,
        DonatorsList,
        CharityCards,
        DonationButton,
    } from '../../components'

    const { page } = stores();

    // Organization
    let organizationId = $page.params.id
    let organization = {}
    $: carousel = (organization.avatars || []).map(p => ({ src: p, alt: 'photo' }))
    onMount(async () => {
        organization = await api.getOrganization(1)
    })

    // Trust button
    let active = false
    async function onClick() {
        active = !active
    }

    // Carousel & FancyBox
    let propsBox = {}
    function onCarouselClick({ detail }) {
        propsBox = { initIndex: detail.index }
    }

    // Avatar fancy
    let avatarFancy = false
</script>

<style>
</style>

<svelte:head>
    <title>Charitify - Organization page.</title>
</svelte:head>

<section class="container scroll-box theme-bg-color-secondary">

    <br>
    <br>

    <Button class="white">
        <div class="flex flex-align-center flex-justify-between full-width">
            <div class="flex flex-align-center">
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
        </div>
    </Button>

    <br>
    <br class="tiny">

    <section class="flex" style="height: 200px">
        <FancyBox>
            <Carousel items={carousel} on:click={onCarouselClick}/>
            <div slot="box">
                <Carousel {...propsBox} items={carousel}/>
            </div>
        </FancyBox>
    </section>

    <br class="big">
    <br>
    <br class="small">
    <br class="tiny">

    <h2>Організація Добра</h2>
    <br class="small">
    <pre class="font-w-300">
        Організація Добра – благодійний фонд, який опікується долею безпритульних котиків та песиків.
        Пропонуємо вам відвідати наш притулок, який знаходиться у Львові, вул. Сахарова 3
    </pre>

    <br>

    <p class="container flex flex-justify-between flex-align-center">
        <span class="flex flex-align-center">
            <Icon is="danger" type="heart-filled" size="medium"/>
            <s></s>
            <s></s>
            <span class="font-secondary font-w-600 h3">1</span>
        </span>

        <span class="flex">
            <Button class="flex flex-align-center" auto size="small">
                <Icon type="share" size="medium" class="theme-svg-fill"/>
                <s></s>
                <s></s>
                <h3 class="font-w-600">Поділитись</h3>
            </Button>
        </span>

        <span class="flex flex-align-center">
            <Icon type="eye" size="medium" class="theme-svg-fill"/>
            <s></s>
            <s></s>
            <span class="font-secondary font-w-600 h3">13</span>
        </span>
    </p>

    <br class="big">
    <br>

    <h1>Фонди тварин</h1>
    <br>
    <br class="tiny">
    <div class="full-container">
        <CharityCards/>
    </div>

    <br class="big">
    <br>
    <br class="small">
    <br class="tiny">

    <h1>Інші фонди</h1>
    <br>
    <br class="tiny">
    <div class="full-container">
        <CharityCards/>
    </div>

    <br class="big">
    <br>
    <br class="small">
    <br class="tiny">

    <h1>Про нас</h1>
    <br class="small">
    <pre class="font-w-300">
        Організація Добра – благодійний фонд, який опікується долею безпритульних котиків та песиків.
        Пропонуємо вам відвідати наш притулок, який знаходиться у Львові,
        вул. Сахарова 3 Організація Добра – благодійний фонд, який опікується долею безпритульних котиків та песиків.
    </pre>

    <br>

    <p class="flex">
        <Button class="flex flex-align-center" auto size="small">
            <Icon type="share" size="medium" class="theme-svg-fill"/>
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
            <Icon type="link" size="medium" class="theme-svg-fill"/>
            <s></s>
            <s></s>
            <p class="font-w-500">Скопіювати</p>
        </Button>
    </p>

    <br class="big">
    <br>
    <br class="small">
    <br class="tiny">

    <section class="flex flex-column flex-align-center flex-justify-center">
        <div style="width: 100px; max-width: 100%">
            <TrustButton isActive={active} on:click={onClick}/>
        </div>
        <br class="small">
        <h2>Я Довіряю</h2>
    </section>

    <br class="big">
    <br>
    <br class="tiny">

    <h1>Останні новини</h1>
    <br>
    <br class="tiny">

    <br class="big">
    <br>
    <br class="tiny">

    <h1>Сертифікати</h1>
    <br>
    <br class="tiny">
    <div class="full-container">
        <Documents/>
    </div>

    <br class="big">
    <br>
    <br class="small">

    <h1>Відео про нас</h1>
    <br>
    <br class="tiny">
    <section class="flex" style="height: 200px">
        <FancyBox>
            <Carousel items={carousel} on:click={onCarouselClick}/>
                <div slot="box">
                    <Carousel {...propsBox} items={carousel}/>
                </div>
        </FancyBox>
    </section>

    <br class="big">
    <br class="big">
    <br class="small">

    <h1>Коментарі</h1>
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
