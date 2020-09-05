<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

    let formFields = [
        {
            label: 'Про нас:',
            type: 'textarea',
            name: 'description',
            meta: {
                rows: 6,
                placeholder: 'Ми піклуємось про...',
                maxlength: 250,
            },
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

<EditCard form="about-form" on:cancel={onCancel}>
    <FormBuilder 
        id="about-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>


