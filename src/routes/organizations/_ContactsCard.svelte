<script>
    import { Br, Card, Icon, Avatar, FancyBox, Loader } from '@components'

    export let items = null
    export let orgName = null
    export let avatar = null
    export let avatarBig = null

    const top = ['telegram', 'facebook', 'viber']
    const icons = {
        phone: 'phone-filled',
        email: 'email',
        location: 'location-mark-filled',
        telegram: 'telegram',
        facebook: 'facebook',
        viber: 'viber',
    }

    $: topItems = items !== null ? items.filter(i => !top.includes(i.type)) : new Array(3).fill(null)
    $: bottomItems = items !== null ? items.filter(i => top.includes(i.type)) : new Array(3).fill(null)
</script>

<Card>
    <section style="padding: 0 20px">
        <Br size="30" />

        <div class="flex flex-column flex-align-center">
            
            <span>
                <FancyBox class="flex-justify-center">
                    <Avatar size="big" src={avatar} alt="Організація"/>
                    <section slot="box" class="flex full-width full-height" style="height: 100vw">
                        <div class="flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch" style="padding: var(--screen-padding) 0">
                            <Avatar src={avatar} srcBig={avatarBig} alt="ava"/>
                        </div>
                    </section>
                </FancyBox>
            </span>

            <Br size="20" />
            <h2>Наші контакти</h2>
            <Br size="5" />

            {#if orgName !== null}
                <p class="h3 font-secondary font-w-500" style="opacity: .7">
                    {orgName}
                </p>
            {:else}
                <p style="width: 60%">
                    <Loader type="h3"/>
                </p>
            {/if}
        </div>

        <Br size="30" />

        <ul>
            {#each topItems as item}
                <li>
                    {#if item !== null}
                        <a href={item.href} class="flex flex-align-center" style="padding: 7px 0" title={item.title}>
                            <Icon type={icons[item.type]} size="medium"/>
                            <s></s>
                            <s></s>
                            <s></s>
                            <p class="h3">{item.title}</p>
                        </a>
                    {:else}
                        <span class="flex flex-align-center" style="padding: 7px 0">
                            <Loader type="h3"/>
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>

        <Br size="30" />

        <ul class="flex flex-justify-center social-icons">
            {#each bottomItems as item}
                {#if item !== null}
                    <li style="padding: 0 10px" class={item.type}>
                        <a href={item.value} target="_blank" title={item.title}>
                            <Icon type={item.type} size="large" class="custom"/>
                        </a>
                    </li>
                {:else}
                    <li style="padding: 0 10px; width: 60px; height: 45px; overflow: hidden">
                        <Loader type="avatar"/>
                    </li>
                {/if}
            {/each}
        </ul>

        <Br size="30" />
    </section>
</Card>

<style>
    .social-icons .telegram * {
        fill: #2197D2;
    }
    .social-icons .facebook * {
        fill: #4267B2;
    }
    .social-icons .viber * {
        fill: #665CAC;
    }
</style>
