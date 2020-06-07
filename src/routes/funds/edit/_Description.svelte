<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Ціль фонду:',
            type: 'text',
            name: 'title',
            meta: {
                disabled: true,
                placeholder: 'Тільки спільними силами...',
                maxlength: 25,
            },
        },
        {
            label: 'Опис фонду:',
            type: 'textarea',
            name: 'description',
            meta: {
                rows: 6,
                placeholder: 'У нас добра мета...',
                max: 250,
            },
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<EditCard form="description-form" on:cancel>
    <FormBuilder 
        id="description-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>  


