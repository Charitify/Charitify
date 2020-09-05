<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

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

    function onCancel() {
        formValues = data
        dispatch('cancel')
    }
</script>

<EditCard form="description-form" on:cancel={onCancel}>
    <FormBuilder 
        id="description-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>  


