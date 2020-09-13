<script>
    import { onMount } from 'svelte'
    import { API } from '@services'
    import { delay, safeGet } from '@utils'
    import { Br, Icon, Card, Avatar, Button, FundCards } from '@components'
    import Usercard from './_Usercard.svelte'

    // Entities
    let organization = {}
    let funds

    $: contacts = safeGet(() => organization.contacts.map(c => ({
        title: c.title,
        href: c.value,
        type: c.type,
    })), null)
    $: animalFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.current_sum,
        currency: f.currency,
        city: f.location.city,
    })), null)
    $: othersFunds = safeGet(() => funds.filter(f => f.type === 'animal').reduce((acc, f) => acc.concat(f, f, f), []).map(f => ({
        id: f.id,
        src: f.avatars[0].src,
        type: f.type,
        title: f.title,
        total: f.need_sum,
        current: f.current_sum,
        currency: f.currency,
        city: f.location.city,
    })), null)

    onMount(async () => {
        await delay(7000)
        organization = await API.getOrganization(1);
        funds = await API.getFunds()
    });
</script>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>
    <Br size="35"/>

    <h1 class="text-center">Про мене</h1>
    <Br size="20"/>

    <Usercard
            items={contacts}
            title={safeGet(() => organization.name)}
            subtitle={safeGet(() => organization.title)}
            src={safeGet(() => organization.avatar)}
            srcBig={safeGet(() => organization.avatarBig)}
    />

    <Br size="15" />

    <Br size="40" />
    <h1>Мої організації</h1>
    <Br size="5" />
    <div class="full-container">
        <FundCards items={animalFunds}>
            <div slot="button" let:item={item}>
                <Button size="small" is="info" href={`/organizations/${item.id}`}>
                    <span class="h3 font-secondary font-w-500 flex flex-align-center">
                        Редагувати
                        <s></s>
                        <s></s>
                        <Icon type="edit" size="small" is="light"/>
                    </span>
                </Button>
            </div>
        </FundCards>
    </div>

    <Br size="35" />
    <Button size="big" is="success" href="/organizations/new">
        <span class="h2 font-secondary font-w-600">
            Додати
        </span>
    </Button>
    <Br size="5" />

    <Br size="15" />
    
    <Br size="40" />
    <h1>Мої фонди</h1>
    <Br size="5" />
    <div class="full-container">
        <FundCards items={othersFunds}>
            <div slot="button" let:item={item}>
                <Button size="small" is="info" href={`/funds/${item.id}`}>
                    <span class="h3 font-secondary font-w-500 flex flex-align-center">
                        Редагувати
                        <s></s>
                        <s></s>
                        <Icon type="edit" size="small" is="light"/>
                    </span>
                </Button>
            </div>
        </FundCards>
    </div>

    <Br size="35" />
    <Button size="big" is="success" href="/funds/new">
        <span class="h2 font-secondary font-w-600">
            Додати
        </span>
    </Button>
    <Br size="5" />

    <Br size="125" />
</section>

<style>
</style>
