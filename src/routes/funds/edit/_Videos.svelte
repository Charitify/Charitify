<script>
    import { createEventDispatcher } from 'svelte'
    import { safeGet } from '@utils'
    import { EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let withButtons = undefined
    export let submit = async () => {}

    const dispatch = createEventDispatcher()

    const defaultField = {
        label: 'Відео 1:',
        type: 'url',
        name: 'videos[0].src',
        meta: {
            placeholder: 'https://www.youtube.com/watch?v=oUcAUwptos4&t',
        }
    }

    $: currentValues = data || {}
    $: formValues = data || {}
    $: formErrors = {}
    $: fieldsAmount = safeGet(() => currentValues.videos.filter(v => v.src).length, 0, true)
    $: formFields = Array.from(new Array(Math.max(2, fieldsAmount + 1))).map((f, i) => ({
        ...defaultField,
        label: `Відео ${i + 1}:`,
        name: `videos[${i}].src`,
    }))

    async function onSubmit(e) {
        await submit(e)
    }

    function shiftValues(values) {
      return {
          ...values,
          videos: safeGet(() => values.videos.filter(v => v.src), [])
      }
    }

    function onChange({ detail: { values } }) {
        currentValues = shiftValues(values)
        if (
            safeGet(() => currentValues.videos.length) !==
            safeGet(() => formValues.videos.length)
        ) {
            formValues = currentValues
        }
        dispatch('change', values)
    }

    function onCancel() {
        currentValues = data
        formValues = data
        dispatch('cancel')
    }
</script>

<EditCard {withButtons} form="videos-form" on:cancel={onCancel}>
    <FormBuilder 
        id="videos-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change={onChange}
    />
</EditCard>

