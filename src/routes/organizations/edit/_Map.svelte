<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Адрес:',
            type: 'url',
            name: 'location.address',
            meta: {
                placeholder: 'https://www.google.com.ua/maps/place/...',
            }
        },
        {
            label: '3D - Тур:',
            type: 'url',
            name: 'location.virtual_tour',
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
</script>

<EditCard form="map-form" on:cancel>
    <FormBuilder 
        id="map-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>

