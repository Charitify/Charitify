<script>
    import { Br, Button, Card, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Відео 1:',
            type: 'url',
            name: 'video[0]',
            meta: {
                placeholder: 'https://www.youtube.com/watch?v=oUcAUwptos4&t',
            }
        },
        {
            label: 'Відео 2:',
            type: 'url',
            name: 'video[1]',
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

<Card class="container">
    <Br size="30"/>

    <FormBuilder 
        id="videos-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />

    <Br size="40"/>

    <Button size="small" type="submit" form="videos-form" is="info">
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            Зберегти
        </span>
    </Button>

    <Br size="40"/>
</Card>    


