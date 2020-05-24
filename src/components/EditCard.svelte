<script>
    import { createEventDispatcher } from 'svelte'
    import { classnames } from '@utils'
    import Br from './Br.svelte'
    import Card from './Card.svelte'
    import Button from './Button.svelte'

    const dispatch = createEventDispatcher()

    export let form

    $: classProp = classnames('edit-area-container container', $$props.class)

    function onCancel(e) {
        dispatch('cancel', e)
    }
</script>

<Card class={classProp}>
    <Br size="30"/>

    <slot/>

    <Br size="40"/>

    <section class="flex flex-align-center">
        <div style="flex: 1 1 50%">
            <Button size="small" is="dark-border" on:click={onCancel}>
                <span class="h3 font-secondary font-w-500 flex flex-align-center">
                    Скасувати
                </span>
            </Button>
        </div>
        <s></s>
        <s></s>
        <s></s>
        <div style="flex: 1 1 50%">
            <Button {form} size="small" type="submit" is="info">
                <span class="h3 font-secondary font-w-500 flex flex-align-center">
                    Зберегти
                </span>
            </Button>
        </div>
    </section>

    <Br size="40"/>
</Card>    