<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { delay, safeGet } from '@utils'
    import { Br, Card, Avatar, Button, FundCards } from '@components'
    import Usercard from './_Usercard.svelte'

    let href = '.'

    // Entities
    let organization = {}
    let funds

    $: contacts = safeGet(() => organization.contacts.map(c => ({
        title: c.title,
        href: c.value,
        type: c.type,
    })))
    $: animalFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.curremt_sum,
        currency: f.currency,
        city: f.location.city,
    })))
    $: othersFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.curremt_sum,
        currency: f.currency,
        city: f.location.city,
    })))

    onMount(async () => {
        await delay(20000)
        organization = await API.getOrganization(1);
        funds = await API.getFunds()
    });
</script>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>
    <Br size="35"/>

    <h1 class="text-center">Про мене</h1>
    <Br size="20"/>

    <Usercard items={contacts} src={safeGet(() => organization.avatars[0])}/>

    <Br size="55" />
    <h1>Мої організації</h1>
    <Br size="5" />
    <div class="full-container">
        <FundCards items={animalFunds}>
            <div slot="button" let:id={id}>
                <Button size="small" is="theme-border" href={id}>
                    <span class="h3 font-secondary font-w-500">
                        Редагувати
                    </span>
                </Button>
            </div>
        </FundCards>
    </div>

    <Br size="35" />
    <Button size="big" is="success" href={href}>
        <span class="h2 font-secondary font-w-600">
            Додати
        </span>
    </Button>
    <Br size="55" />

    <h1>Мої фонди</h1>
    <Br size="5" />
    <div class="full-container">
        <FundCards items={othersFunds}>
            <div slot="button" let:id={id}>
                <Button size="small" is="theme-border" href={id}>
                    <span class="h3 font-secondary font-w-500">
                        Редагувати
                    </span>
                </Button>
            </div>
        </FundCards>
    </div>

    <Br size="35" />
    <Button size="big" is="success" href={href}>
        <span class="h2 font-secondary font-w-600">
            Додати
        </span>
    </Button>

    <Br size="125" />
</section>

<style>
</style>
