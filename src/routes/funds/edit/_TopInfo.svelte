<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Фотогалерея:',
            type: 'files',
            name: 'photos',
            meta: {
                multiple: true,
            }
        },
        {
            label: 'Організація:',
            type: 'select',
            name: 'organization',
            meta: {
                placeholder: 'Вибрати...',
                options: [
                    {
                        value: 'org1',
                        label: 'Організація 1',
                    },
                    {
                        value: 'org2',
                        label: 'Організація 2',
                    },
                    {
                        value: 'org3',
                        label: 'Організація 3',
                    }
                ]
            }
        },
        {
            label: 'Назва фонду:',
            type: 'text',
            name: 'title',
            meta: {
                placeholder: 'Врятуємо її...',
                maxlength: 20,
            },
        },
        {
            label: 'Ціль фонду:',
            type: 'text',
            name: 'subtitle',
            meta: {
                placeholder: 'Тільки спільними силами...',
                maxlength: 25,
            },
        },
        {
            label: 'Потрібно зібрати:',
            type: 'number',
            name: 'need_sum',
            meta: {
                placeholder: 10,
                min: 10,
                max: 100000000,
            },
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<EditCard form="top-info-form" on:cancel>
    <FormBuilder 
        id="top-info-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>   

