<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'
    import Br from '@components/Br.svelte'
    import Form from '@components/Form.svelte'
    import Loader from '@components/Loader'
    import { 
        Input,
        Select,
        ReadField,
        UploadBox,
        CheckboxGroup,
        UploadBoxGroup,
    } from '@components/fields'

    const dispatch = createEventDispatcher()

    export let id = undefined
    /**
     * @type {{
     *    name: string,
     *    type: string, ('files' and types of native input: https://www.w3schools.com/tags/att_input_type.asp)
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

    let values = data
    let submitting = false

    $: classProp = classnames('form-builder', { submitting })
    
    function onChange({ detail: { name, value } }) {
        values[name] = value
        dispatch('change', values)
    }

    async function onSubmit() {
        try {
            submitting = true
            await submit(values)
        } catch(e) {
            console.warn('FormBuilder/submit error: ', e)
        }
        submitting = false
    }
</script>

<Form {id} on:submit={onSubmit} class={classProp}>
    {#each items as item, i}
        {#if i}
            <Br size="30"/>
        {/if}
        {#if ['text', 'number', 'textarea', 'email', 'password', 'search', 'tel', 'url', 'date', 'datetime-local', 'time'].includes(item.type)}
            {#if data[item.name] !== null}
                <Input
                    {...item.meta}
                    name={item.name}
                    type={item.type}
                    label={item.label}
                    value={data[item.name]}
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
                    value={data[item.name]}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['select'].includes(item.type)}
            {#if data[item.name] !== null}
                <Select
                    {...item.meta}
                    name={item.name}
                    type={item.type}
                    label={item.label}
                    value={data[item.name]}
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
                    value={data[item.name]}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else if ['files'].includes(item.type)}
            <UploadBoxGroup
                    {...item.meta}
                    name={item.name}
                    label={item.label}
                    value={data[item.name]}
                    errors={errors[item.name]}
                    on:change={onChange}
            />
        {:else}
            <slot {item} {data} {errors}>
                {#if data[item.name] !== null}
                    <ReadField
                        {...item.meta}
                        label={item.label}
                        value={data[item.name]}
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
