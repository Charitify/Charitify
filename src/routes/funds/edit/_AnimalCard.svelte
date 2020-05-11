<script>
    import { Br, Button, Card, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
         {
            label: 'Аватар:',
            type: 'custom-avatar',
            name: 'avatar',
            meta: {
                accept: 'image/jpeg,image/png',
            }
        },
        {
            label: 'Кличка:',
            type: 'text',
            name: 'name',
            meta: {
                placeholder: 'Локі...',
                maxlength: 20,
            },
        },
        {
            label: 'Порода:',
            type: 'text',
            name: 'breed',
            meta: {
                placeholder: 'Лабрадор...',
                maxlength: 20,
            },
        },
        {
            label: 'День народження:',
            type: 'date',
            name: 'birth',
            meta: {
                placeholder: '18.03.2019...',
            },
        },
        {
            label: 'Стать:',
            type: 'radio-rect',
            name: 'sex',
            meta: {
                options: [
                    {
                        label: 'Він',
                        value: 'male',
                        preIcon: 'check-flag',
                    },
                    {
                        label: 'Вона',
                        value: 'female',
                        preIcon: 'check-flag',
                    }
                ]
            },
        },
        {
            label: 'Стерилізація?',
            type: 'radio-rect',
            name: 'sterilization',
            meta: {
                options: [
                    {
                        label: 'Так',
                        value: true,
                        preIcon: 'check-flag',
                    },
                    {
                        label: 'Ні',
                        value: false,
                        preIcon: 'close',
                    }
                ]
            },
        },
        {
            label: 'Характер:',
            type: 'radio-rect',
            name: 'character_short',
            meta: {
                options: [
                    {
                        label: '😃',
                        value: '😃',
                    },
                    {
                        label: '😇',
                        value: '😇',
                    },
                    {
                        label: '😜',
                        value: '😜',
                    },
                    {
                        label: '😎',
                        value: '😎',
                    },
                    {
                        label: '😝',
                        value: '😝',
                    }
                ]
            },
        },
        {
            label: 'Опис характеру:',
            type: 'textarea',
            name: 'character',
            meta: {
                rows: 6,
                maxlength: 75,
                placeholder: 'Грайливий та веселий песик...',
            },
        },
        {
            label: 'Історія тваринки:',
            type: 'custom-lifestory',
            name: 'lifestory',
            meta: {
                max: 100,
                maxlength: 75,
            },
        },
        {
            label: 'Вакцинація:',
            type: 'checkbox',
            name: 'vaccination',
            meta: {
                options: [
                    {
                        text: 'Від кліщів',
                        value: 'from-fungi'
                    },
                    {
                        text: 'Від сказу',
                        value: 'from-rabies'
                    },
                    {
                        text: 'Від парагрипу',
                        value: 'from-parainfluenza'
                    },
                    {
                        text: 'Від чума м\'ясоїдних',
                        value: 'from-carnivorous-plague'
                    },
                    {
                        text: 'Від парвовіроз',
                        value: 'from-parvovirus'
                    },
                    {
                        text: 'Від аденовіроз',
                        value: 'from-adenovirus'
                    },
                    {
                        text: 'Від лептоспіроз',
                        value: 'from-leptospirosis'
                    },
                ]
            },
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<Card class="container">
    <Br size="30"/>

    <FormBuilder 
        id="description-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />

    <Br size="40"/>

    <Button size="small" type="submit" form="top-info-form" is="info">
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            Зберегти
        </span>
    </Button>

    <Br size="40"/>
</Card>    


