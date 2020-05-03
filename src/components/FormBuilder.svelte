<script>
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
    <fieldset>
        <input type="tel" name="phone" id="frmPhoneNumA" placeholder="+1-650-450-1212" required="" autocomplete="tel">
        {#each items as item, i}
            {#if i}
                <Br size="30"/>
            {/if}
            {#if ['text', 'textarea', 'email', 'password', 'tel', 'date', 'datetime-local', 'search', 'time'].includes(item.type)}
                {#if data[item.name] !== null}
                    <Input
                            {...item.meta}
                            name={item.name}
                            type={item.type}
                            label={item.label}
                            value={data[item.name]}
                            errors={errors[item.name]}
                    />
                {:else}
                    <div>
                        <Loader type="h2" />
                        <Loader height="50"/>
                    </div>
                {/if}
            {:else if ['select'].includes(item.type)}
                {#if data[item.name] !== null}
                    <Select
                            {...item.meta}
                            name={item.name}
                            type={item.type}
                            label={item.label}
                            value={data[item.name]}
                            errors={errors[item.name]}
                    />
                {:else}
                    <div>
                        <Loader type="h2" />
                        <Loader height="50"/>
                    </div>
                {/if}
            {:else}
                {#if data[item.name] !== null}
                    <ReadField
                            label={item.label}
                            value={data[item.name]}
                    />
                {:else}
                    <div>
                        <Loader type="h2" />
                        <Loader type="p" />
                    </div>
                {/if}
            {/if}
        {/each}
    </fieldset>
</Form>
