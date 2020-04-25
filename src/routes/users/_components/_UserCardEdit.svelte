<script>
    import { Br, Avatar, Loader, FormBuilder } from '@components'

    export let src
    export let title
    export let subtitle
    // export let itemsX
    // export let itemsY

    let values = {
        password: 'asd',
        full_name: 'some value',
    }

    let formFields = [
        {
            type: 'text',
            name: 'full_name',
            label: 'Моє ім\'я',
        },
        {
            type: 'password',
            name: 'password',
            label: 'Пароль',
        }
    ]
</script>

<div class="text-center flex flex-column flex-align-center">
    <span>
        <Avatar size="big" {src} alt="Організація"/>
    </span>

    <Br size="20"/>

    {#if title !== undefined}
    {#if title !== null}
        <h2>{title}</h2>
    {:else}
        <div style="width: 200px"><Loader type="h2"/></div>
    {/if}
    {/if}
    <Br size="4"/>
    {#if title !== undefined}
    {#if title !== null}
        <p>{subtitle}</p>
    {:else}
        <div style="width: 100px"><Loader type="p"/></div>
    {/if}
    {/if}

    <Br size="40"/>
    <section class="full-width">
        <FormBuilder
                items={formFields}
                data={values}
        />
    </section>
</div>
