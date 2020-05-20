<script>

    import { createEventDispatcher } from 'svelte'
    import { classnames, toCSSString } from '@utils'
    import Br from '@components/Br.svelte'
    import Icon from '@components/Icon.svelte'
    import Modal from '@components/Modal.svelte'
    import Loader from '@components/loader'
    import Button from '@components/Button.svelte'

    const dispatch = createEventDispatcher()

    export let id = undefined
    export let name = undefined
    export let label = undefined
    export let value = undefined
    export let style = undefined
    export let readonly = undefined

    let open = false

    $: idProp = id || name
    $: classProp = classnames('story-list', $$props.class)
    $: styleProp = toCSSString({ ...style })

    function onRemove({ index }, e) {
        const val = [...value.filter((_, ind) => ind !== index)]
        dispatch('change', { e, name, value: val })
    }
</script>

<style>
    table tr:not(:last-child) td {
        padding-bottom: 16px;
    }

    table td:last-child {
        font-weight: 300;
    }
</style>

<section id={idProp} class={classProp} style={styleProp}>
    {#if label}
        <h2 class="text-left">{label}</h2>
        <Br size="10"/>
    {/if}

    <table>
        <tbody>
            {#if value !== null && Array.isArray(value) && value.length}
                {#each value.filter(Boolean) as val, i}
                    <tr>
                        <td>{val.date}</td>
                        <td>—</td>
                        <td>{val.title}</td>
                        {#if !readonly}
                            <td>
                                <Button 
                                    auto 
                                    style="vertical-align: middle"
                                    on:click={onRemove.bind(null, { id: val.id, index: i })}
                                >
                                    <Icon type="close" size="medium"/>
                                </Button>
                            </td>
                        {/if}
                    </tr>
                {/each}
            {:else if value === null}
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
                <tr>
                    <td><Loader type="p"/></td>
                    <td>—</td>
                    <td>
                        <Loader type="p"/>
                        <Loader type="p"/>
                    </td>
                </tr>
            {/if}
        </tbody>
    </table>

    {#if !readonly}
        <Br size="25"/>
        <Button auto is="info" on:click={() => open = true}>
            <h3 style="padding: 10px 25px" class="font-w-500">
                Додати подію
            </h3>
        </Button>
    {/if}
</section>

<Modal 
    {open}
    id="story-life-modal"
    size="medium"
    on:close={() => open = false}
>
    Something
</Modal>   