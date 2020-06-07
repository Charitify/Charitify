<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            type: 'avatar',
            name: 'avatar',
            meta: {
                accept: 'image/jpeg,image/png',
            }
        },
        {
            label: 'Назва організації:',
            type: 'text',
            name: 'name',
            meta: {
                placeholder: 'Локі...',
                maxlength: 20,
            },
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<EditCard form="organization-form" on:cancel>
    <FormBuilder 
        id="organization-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>   

