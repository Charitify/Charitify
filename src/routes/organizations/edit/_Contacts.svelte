<script>
    import { createEventDispatcher } from 'svelte'
    import { options } from '@config'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

    let formFields = [
        {
            type: 'avatar',
            name: 'avatar',
            meta: {
                accept: 'image/jpeg,image/png',
            }
        },
        {
            label: 'Телефон:',
            type: 'tel',
            name: 'phone',
            meta: {
                placeholder: '+380974354532',
            },
        },
        {
            label: 'Email:',
            type: 'email',
            name: 'email',
            meta: {
                placeholder: 'mylovedmail@gmail.com',
            },
        },

        {
            label: 'Адреса:',
            type: 'search',
            name: 'address',
            meta: {
                placeholder: 'Почніть вводити...',
                maxlength: 50,
            },
        },
        {
            label: 'Соцмережі:',
            type: 'custom-socials',
            name: 'socials',
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

<EditCard form="contacts-form" on:cancel={onCancel}>
    <FormBuilder 
        id="contacts-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
        let:item={item}
        let:value={value}
        let:onChange={onChange}
    >
        {#if item.type === 'custom-socials'}
            Socials
        {/if}
    </FormBuilder>
</EditCard> 


