<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

    let formFields = [
        {
            label: 'Документи:',
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

    function onCancel() {
        formValues = data
        dispatch('cancel')
    }
</script>

<EditCard form="documents-form" on:cancel={onCancel}>
    <FormBuilder 
        id="documents-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard> 


