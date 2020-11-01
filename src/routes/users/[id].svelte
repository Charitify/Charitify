<script>
    import { stores } from '@sapper/app'
    import { root, user, organization, funds } from '@store';
    import { API } from '@services'
    import { safeGet } from '@utils'
    import { Br, Icon, Button, FundCards } from '@components'
    import Usercard from './_Usercard.svelte'

    const { page } = stores()

    $: userId = $page.params.id
    $: isIam = userId === 'me'
    $: activeUser = isIam ? $root : $user

    $: fetchData(userId)
    
    $: contacts = safeGet(() => ['phone', 'email', 'telegram', 'facebook', 'viber'].map(k => ({
        title: k,
        type: k,
        href: activeUser[k],
    })), null)
    $: organizationsList = safeGet(() => [$organization].filter(Boolean).map(f => ({
        id: safeGet(() => f._id),
        src: safeGet(() => f.logo),
        title: safeGet(() => f.name),
        total: safeGet(() => f.needed_sum),
        current: safeGet(() => f.current_sum),
        city: safeGet(() => f.location.city),
    })), null)
    $: fundsList = safeGet(() => $funds.map(f => ({
        id: safeGet(() => f._id),
        src: safeGet(() => f.logo),
        title: safeGet(() => f.name),
        total: safeGet(() => f.needed_sum),
        current: safeGet(() => f.current_sum),
        city: safeGet(() => f.location.city),
    })), null)

    async function fetchData () {
        if (!isIam) user.set(await API.getUser(userId).catch(() => null))
        const newActiveUser = !isIam ? $user : activeUser
        if (newActiveUser) {
            organization.set(await API.getOrganization(newActiveUser.organization_id).catch(() => null))
            funds.set(await API.getFundsByOrg(newActiveUser.organization_id).catch(() => null))
        }
    }
</script>

<section class="container theme-bg-color-secondary">
    <Br size="var(--header-height)"/>
    <Br size="35"/>

    <h1 class="text-center">{isIam ? 'Про мене' : `Про ${(activeUser || {}).fullname || ''}`}</h1>
    <Br size="20"/>

    <Usercard
            items={contacts}
            title={safeGet(() => activeUser.fullname)}
            subtitle={safeGet(() => activeUser.name)}
            src={safeGet(() => activeUser.avatar)}
    />

    <Br size="15" />

    <Br size="40" />
    <h1>Мої організації</h1>
    <Br size="5" />
    <div class="full-container">
        <FundCards items={organizationsList === null ? [{}] : organizationsList}>
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
        <FundCards items={fundsList === null ? [{}, {}, {}] : fundsList}>
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
