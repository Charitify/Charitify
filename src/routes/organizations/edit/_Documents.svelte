<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Сертифікати:',
            type: 'files',
            name: 'documents',
            meta: {
                multiple: true,
                accept: 'image/jpeg,image/png,application/pdf',
            }
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<EditCard form="documents-form" on:cancel>
    <FormBuilder 
        id="documents-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>

