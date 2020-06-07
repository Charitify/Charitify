<script>
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Відео 1:',
            type: 'url',
            name: 'media[0]',
            meta: {
                placeholder: 'https://www.youtube.com/watch?v=oUcAUwptos4&t',
            }
        },
        {
            label: 'Відео 2:',
            type: 'url',
            name: 'media[1]',
            meta: {
                placeholder: 'https://www.youtube.com/watch?v=oUcAUwptos4&t',
            }
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
        id="videos-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />
</EditCard>    


