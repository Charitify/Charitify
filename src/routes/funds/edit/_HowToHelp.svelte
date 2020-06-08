<script>
    import { createEventDispatcher } from 'svelte'
    import { EditCard, FormBuilder } from '@components'
    import { formatTextToBullets } from '@utils'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

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

    function onCancel() {
        formValues = data
        dispatch('cancel')
    }

    function beforeFormChange(values) {
        values.how_to_help = formatTextToBullets(values.how_to_help)
        return values
    }
</script>

<EditCard form="howtohelp-form" on:cancel={onCancel}>
    <FormBuilder 
        id="howtohelp-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        beforeChange={beforeFormChange}
        on:change
    />
</EditCard> 


