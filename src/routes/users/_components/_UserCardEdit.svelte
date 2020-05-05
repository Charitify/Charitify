<script>
    import { Br, Avatar, Loader, FormBuilder } from '@components'

    export let src
    export let title
    export let subtitle
    // export let itemsX
    // export let itemsY

    let formValues = {

    }

    let formErrors = {
        password: 'Обов\'язкове поле',
        name: 'Мало символів',
        email: 'Некоректний email',
        organization: 'Некоректно',
    }

    let formFields = [
        {
            label: 'Моє ім\'я:',
            type: 'text',
            name: 'name',
            meta: {
                placeholder: 'Віталій Бублик',
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
            label: 'Телефон:',
            type: 'tel',
            name: 'phone',
            meta: {
                placeholder: '+380974354532',
            },
        },
        {
            label: 'Місто:',
            type: 'text',
            name: 'ship-city',
            meta: {
                postIcon: 'search',
                placeholder: 'Львів...',
            }
        },
        {
            label: 'День народження:',
            type: 'date',
            name: 'bday',
            meta: {
                placeholder: '10.10.2010',
            },
        },
        {
            label: 'Пароль:',
            type: 'password',
            name: 'password',
            meta: {
                minlength: 8,
                required: 'required',
                placeholder: 'Введіть пароль...',
            },
        },
        {
            label: 'Вакцинація:',
            type: 'checkbox',
            name: 'vaccines',
            meta: {
                options: [
                    {
                        value: 'org1',
                        label: 'Дім Сірка',
                    },
                    {
                        value: 'org2',
                        label: 'Милосердя',
                    },
                    {
                        value: 'org3',
                        label: 'Добрі люди Добрі люди Добрі люди Добрі люди Добрі люди Добрі люди Добрі люди',
                    }
                ]
            },
        },
        {
            label: 'Організація:',
            type: 'select',
            name: 'organization',
            meta: {
                placeholder: 'Виберіть організацію...',
                options: [
                    {
                        value: '',
                        label: 'Вибрати...',
                    },
                    {
                        value: 'org1',
                        label: 'Дім Сірка',
                    },
                    {
                        value: 'org2',
                        label: 'Милосердя',
                    },
                    {
                        value: 'org3',
                        label: 'Добрі люди',
                    }
                ]
            },
        },
        {
            label: 'Опис фонду:',
            type: 'textarea',
            name: 'description',
            meta: {
                rows: 6,
                placeholder: 'Збираємо гроші на допомогу...',
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

        <button type="submit" form="user-form">Зберегти</button>
    </section>
</div>
