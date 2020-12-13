<script>
    import { createEventDispatcher } from 'svelte'
    import { formatTextToBullets } from '@utils'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let withButtons = undefined
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

<EditCard {withButtons} form="howtohelp-form" on:cancel={onCancel}>
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


