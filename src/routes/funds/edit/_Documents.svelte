<script>
    import { Br, Button, Card, FormBuilder } from '@components'
    import { Description } from '../components'

    export let data = undefined
    export let submit = async () => {}

    let formFields = [
        {
            label: 'Документи:',
            type: 'files',
            name: 'documents',
            meta: {
                multiple: true,
                accept: 'image/jpeg,image/png,application/pdf',
            }
        },
    ]

    let formValues = data || {}
    let formErrors = {}

    async function onSubmit(e) {
        await submit(e)
    }
</script>

<Card class="container">
    <Br size="30"/>

    <FormBuilder 
        id="documents-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
    />

    <Br size="20"/>

    <Button size="small" type="submit" form="top-info-form" is="info">
        <span class="h3 font-secondary font-w-500 flex flex-align-center">
            Зберегти
        </span>
    </Button>

    <Br size="40"/>
</Card>    


