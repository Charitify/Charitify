<script>
    import { _ } from '@utils'
    import Br from '@components/Br.svelte'
    import Form from '@components/Form.svelte'
    import Loader from '@components/Loader'
    import { Input, Select, ReadField } from '@components/fields'

    export let id = undefined
    /**
     * @type {{
     *    name: string,
     *    type: string, (types of native input: https://www.w3schools.com/tags/att_input_type.asp)
     *    label: string,
     *    meta: {
     *        required: boolean,
     *        disabled: boolean,
     *    }
     * }[]}
     */
    export let items = []
    export let data = {}
    export let errors = {}
</script>

<Form {id} on:submit>
    {#each items as item, i}
        {#if i}
            <Br size="30"/>
        {/if}
        {#if ['text', 'textarea', 'email', 'password', 'tel', 'date', 'datetime-local', 'search', 'time'].includes(item.type)}
            {#if _.get(data, 'item.name') !== null}
                <Input
                        {...item.meta}
                        name={item.name}å
                        type={item.type}
                        label={item.label}
                        value={_.get(data, 'item.name')}
                        errors={_.get(errors, 'item.name')}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else if ['select'].includes(item.type)}
            {#if _.get(data, 'item.name') !== null}
                <Select
                        {...item.meta}
                        name={item.name}
                        type={item.type}
                        label={item.label}
                        value={_.get(data, 'item.name')}
                        errors={_.get(errors, 'item.name')}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else}
            {#if _.get(data, 'item.name') !== null}
                <ReadField
                        label={item.label}
                        value={_.get(data, 'item.name')}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader type="p" />
                </div>
            {/if}
        {/if}
    {/each}
</Form>
