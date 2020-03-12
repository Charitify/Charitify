<script>
    import { stores } from '@sapper/app'

    const { page } = stores()
    import { onMount } from 'svelte'
    import { api } from '../../services'
    import {
        Footer,
        Comments,
        CharityCards,
        TitleSubTitle,
        AvatarAndName,
        DonatingGroup,
        ContactsHolder,
        TrustButton,
    } from '../../layouts'
    import { Button, Progress, Carousel, Divider, Card, Icon, Avatar } from '../../components'

    let charityId = $page.params.id

    let charity = {}

    $: carousel = (charity.avatars || []).map(p => ({ src: p, alt: 'photo' }))

    onMount(async () => {
        charity = await api.getFund(1)
    })

    let active = false

    async function onClick() {
        active = !active
    }
</script>

<svelte:head>
    <title>Charitify - Charity page and donate.</title>
</svelte:head>

<style>
    .top {
        height: 200px;
        display: flex;
        margin-bottom: calc(var(--screen-padding) * 1.5);
        margin-top: var(--screen-padding);
    }

    table td:first-child {
        font-weight: bold;
    }
</style>

<section class="container scroll-box theme-bg-color-secondary">

    <br>

    <section class="top">
        <Carousel items={carousel}/>
    </section>

    <Button class="white">
        OrgAva
    </Button>

    <br>

    <Card class="container">
        <br>
        <br class="small">

        <h1>Save dogs together</h1>
        <br class="small">
        <h4 style="color: rgba(var(--color-black), .7)">Racing money for charity</h4>

        <br>
        <br class="small">

        <p>
            <span class="h1">600$</span>
            <span class="h3"> / 1150$</span>
        </p>

        <br>

        <Progress value="60"/>

        <br class="big">
    </Card>

    <br>

    <p class="container flex flex-justify-between flex-align-center">
            <span class="flex flex-align-center">
                <Icon is="danger" type="heart-filled"/>
                <s></s>
                23
            </span>
        <span class="flex flex-align-center">
                <Icon is="dark" type="eye"/>
                <s></s>
                120
            </span>
    </p>

    <br class="big">

    <h1>Save dogs together</h1>
    <br>
    <p>
        But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and
        I will give you a complete account of the system, and expound the actual teachings I must explain to you how
        all this mistaken idea of denouncing pleasure and praising pain was born and I will give
    </p>

    <br>
    <br>
    <br>

    <section class="flex flex-column flex-align-center flex-justify-center">
        <div style="width: 100px; max-width: 100%">
            <TrustButton isActive={active} on:click={onClick}/>
        </div>
        <br class="small">
        <p class="h2">I trust</p>
    </section>

    <br>
    <br>
    <br>

    <Card class="container">
        <br class="big">

        <div class="flex flex-column flex-align-center">
            <Avatar size="big" src="https://placeimg.com/300/300/animal"/>

            <br class="big">

            <h1>Volter</h1>
            <br class="tiny">
            <p>Jack Russell Terrier</p>
        </div>

        <br class="big">

        <p class="h1">Сharacter of pet</p>
        <br class="tiny">
        <p>Very playfull and cute dog. And must explain to you how all this mistaken idea of </p>

        <br class="big">

        <p class="h1">History of pet</p>
        <br class="tiny">
        <table>
            <tbody>
            <tr>
                <td>01.02.2019</td>
                <td>—</td>
                <td>His first Happy Birthday</td>
            </tr>
            <tr>
                <td>05.02.2019</td>
                <td>—</td>
                <td>We got him from the owners at the shelter</td>
            </tr>
            <tr>
                <td>07.03.2019</td>
                <td>—</td>
                <td>We do a vaccination for him from fleas</td>
            </tr>
            <tr>
                <td>23.06.2019</td>
                <td>—</td>
                <td>We do anouter vaccination</td>
            </tr>
            </tbody>
        </table>

        <br class="big">

        <p class="h1">Vaccination</p>
        <br>
        <ul class="flex flex-column">
            <li>
                <span class="flex flex-align-center">
                    <Icon is="primary" type="checked-circle"/> <s></s> From something
                </span>
            </li>
            <li>
                <br>
                <span class="flex flex-align-center">
                    <Icon is="primary" type="checked-circle"/> <s></s> From something else
                </span>
            </li>
            <li>
                <br>
                <span class="flex flex-align-center">
                    <Icon is="danger" type="cancel-circle"/> <s></s> From another
                </span>
            </li>
        </ul>

        <br class="big">
    </Card>

    <br class="big">
    <br class="big">

    <p class="h1">Last donates</p>

    <br class="big">
    <br class="big">

    <p class="h1">Documents</p>

    <br class="big">
    <br class="big">

    <p class="h1">Videos about pet</p>

    <br class="big">
    <br class="big">

    <p class="h1">Contacts</p>

    <br class="big">
    <br class="big">

    <p class="h1">Comments </p>

    <br class="big">
    <br class="big">
    <br class="big">
    <br class="big">
    <br class="big">
    <br class="big">

</section>

