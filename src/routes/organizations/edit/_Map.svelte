<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

    let formFields = [
        {
            label: 'Адрес:',
            type: 'url',
            name: 'location.map',
            meta: {
                placeholder: 'https://www.google.com.ua/maps/place/...',
            }
        },
        {
            label: '3D - Тур:',
            type: 'url',
            name: 'location.tour',
            meta: {
                placeholder: 'https://www.google.com.ua/maps/@48.8994332,24.7567114...',
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

<EditCard form="map-form" on:cancel={onCancel}>
    <FormBuilder 
        id="map-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>

