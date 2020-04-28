<script>
    import { _ } from '@utils'
    import Br from '@components/Br.svelte'
    import Form from '@components/Form.svelte'
    import Loader from '@components/Loader'
    import { Input } from '@components/fields'

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
</script>

<Form {id} on:submit>
    {#each items as item, i}
        {#if i}
            <Br size="30"/>
        {/if}
        {#if ['text', 'email', 'password', 'tel', 'date', 'datetime-local', 'search', 'time'].includes(item.type)}
            {#if _.get(data, item.name) !== null}
                <Input
                        type={item.type}
                        name={item.name}
                        label={item.label}
                        value={_.get(data, item.name)}
                        disabled={_.get(item, 'meta.disabled')}
                        required={_.get(item, 'meta.required')}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else}
            {#if _.get(data, item.name) !== null}
                <div>
                    <h2>{item.label}</h2>
                    <p>{data[item.name]}</p>
                </div>
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader type="p" />
                </div>
            {/if}
        {/if}
    {/each}
</Form>