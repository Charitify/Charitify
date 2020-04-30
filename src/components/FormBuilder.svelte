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
    export let errors = {}
</script>

<Form {id} on:submit>
    {#each items as item, i}
        {#if i}
            <Br size="30"/>
        {/if}
        {#if ['text', 'email', 'password', 'tel', 'date', 'datetime-local', 'search', 'time'].includes(item.type)}
            {#if _.get(data, 'item.name') !== null}
                <Input
                        type={item.type}
                        name={item.name}
                        label={item.label}
                        value={_.get(data, 'item.name')}
                        errors={_.get(errors, 'item.name')}
                        disabled={_.get(item, 'meta.disabled')}
                        required={_.get(item, 'meta.required')}
                        placeholder={_.get(item, 'meta.placeholder')}
                />
            {:else}
                <div>
                    <Loader type="h2" />
                    <Loader height="50"/>
                </div>
            {/if}
        {:else}
            {#if _.get(data, 'item.name') !== null}
                <div class="block full-width text-left">
                    <h2 class="block full-width">{item.label}</h2>
                    <Br size="10"/>
                    <p class="block full-width">{data[item.name] || '—'}</p>
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
