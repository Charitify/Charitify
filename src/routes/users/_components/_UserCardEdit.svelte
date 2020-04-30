<script>
    import { Br, Avatar, Loader, FormBuilder } from '@components'

    export let src
    export let title
    export let subtitle
    // export let itemsX
    // export let itemsY

    let formValues = {
        password: 'asd',
        full_name: 'some value',
    }

    let formErrors = {
        password: 'Обов\'язкове поле',
        full_name: 'Мало символів',
    }

    let formFields = [
        {
            label: 'Моє ім\'я:',
            type: 'text',
            name: 'full_name',
            meta: {
                placeholder: 'Віталій Бублик',
            },
        },
        {
            label: 'Телефон:',
            type: 'tel',
            name: 'phone',
            meta: {
                placeholder: '+380974354532',
            },
        },
        {
            label: 'Email:',
            type: 'email',
            name: 'email',
            meta: {
                placeholder: 'mylovedmail@gmail.com',
            },
        },
        {
            label: 'День народження:',
            type: 'date',
            name: 'birth',
            meta: {
                placeholder: '10.10.2010',
            },
        },
        {
            label: 'Стать:',
            type: 'radio',
            name: 'sex',
        },
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
                data={formValues}
                errors={formErrors}
        />
    </section>
</div>
