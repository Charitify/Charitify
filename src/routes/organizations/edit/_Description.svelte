<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let withButtons = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

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
            label: 'Мета організації:',
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

<EditCard {withButtons} form="description-form" on:cancel={onCancel}>
    <FormBuilder 
        id="description-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>   


