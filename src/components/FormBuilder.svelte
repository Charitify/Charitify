<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames, _ } from '@utils'
    import Br from '@components/Br.svelte'
    import Form from '@components/Form.svelte'
    import Loader from '@components/loader'
    import { 
        Input,
        Select,
        ReadField,
        UploadBox,
        RadioRect,
        AvatarUpload,
        CheckboxGroup,
        UploadBoxGroup,
    } from '@components/fields'

    const dispatch = createEventDispatcher()

    export let id = undefined
    /**
     * @type {{
     *    name: string,
     *    type: string, ('files', 'radio-rect' and types of native input: https://www.w3schools.com/tags/att_input_type.asp)
     *    label: string,
     *    meta: {
     *        required: boolean,
     *        disabled: boolean,
     *        ...rest that can be applied to a field.
     *    }
     * }[]}
     */
    export let items = []
    export let data = {}
    export let errors = {}
    export let submit = async () => {}
    export let beforeChange = values => values

    let submitting = false

    $: values = _.cloneDeep(data)
    $: classProp = classnames('form-builder', { submitting })

    function onChange({ detail: { e, name, value } }) {
        values = beforeChange(_.set(values, name, value))
        dispatch('change', { e, name, value, values })
    }

    function getValue(values, name) {
      const val = _.get(values, name)
      return val === undefined ? '' : val
    }

    async function onSubmit() {
        submitting = true
        await submit(values).catch((err) => console.warn('FormBuilder/submit error: ', err))
        submitting = false
    }
</script>

<Form {id} on:submit={onSubmit} class={classProp}>
    {#each items as item, i}
        {#if i}
            <Br size="30"/>
        {/if}
        {#if ['text', 'number', 'textarea', 'email', 'password', 'search', 'tel', 'url', 'date', 'datetime-local', 'time'].includes(item.type)}
            {#if values[item.name] !== null}
                <Input
                    {...item.meta}
                    name={item.name}
                    type={item.type}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:input={onChange}
                    on:change={onChange}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else if ['checkbox'].includes(item.type)}
            <CheckboxGroup
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['select'].includes(item.type)}
            {#if values[item.name] !== null}
                <Select
                    {...item.meta}
                    name={item.name}
                    type={item.type}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else if ['file'].includes(item.type)}
            <UploadBox
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['files'].includes(item.type)}
            <UploadBoxGroup
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['avatar'].includes(item.type)}
            <AvatarUpload
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['radio-rect'].includes(item.type)}
            <RadioRect
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={getValue(values, item.name)}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else}
            <slot {item} {values} {errors} {onChange} value={values[item.name]}>
                {#if values[item.name] !== null}
                    <ReadField
                        {...item.meta}
                        label={item.label}
                        value={getValue(values, item.name)}
                    />
                {:else}
                    <div>
                        <Loader type="h2" />
                        <Loader type="p" />
                    </div>
                {/if}
            </slot>
        {/if}
    {/each}
</Form>
