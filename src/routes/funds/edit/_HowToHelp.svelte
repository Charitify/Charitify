<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Як можна допомогти:',
            type: 'textarea',
            name: 'how_to_help',
            meta: {
                placeholder: '· Привести корм',
                rows: 6,
            }
        },
    ]

    $: formValues = data || {}
    $: formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<EditCard form="howtohelp-form" on:cancel>
    <FormBuilder 
        id="howtohelp-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard> 


