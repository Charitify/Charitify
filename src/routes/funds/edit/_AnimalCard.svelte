<script>
    import { createEventDispatcher } from 'svelte'
    import { options } from '@config'
    import { Br, Square, RadioRect, StoryList, EditCard, FormBuilder } from '@components'

    export let data = undefined
    export let withButtons = undefined
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
            label: 'Кличка:',
            type: 'text',
            name: 'name',
            meta: {
                placeholder: 'Локі...',
                maxlength: 20,
            },
        },
        {
            label: 'Порода:',
            type: 'text',
            name: 'breed',
            meta: {
                placeholder: 'Лабрадор...',
                maxlength: 20,
            },
        },
        {
            label: 'День народження:',
            type: 'date',
            name: 'birth',
            meta: {
                placeholder: '18.03.2019...',
            },
        },
        {
            label: 'Стать:',
            type: 'radio-rect',
            name: 'sex',
            meta: {
                options: [
                    {
                        label: 'Він',
                        value: 'male',
                        preIcon: 'check-flag',
                    },
                    {
                        label: 'Вона',
                        value: 'female',
                        preIcon: 'check-flag',
                    }
                ]
            },
        },
        {
            label: 'Стерилізація?',
            type: 'radio-rect',
            name: 'sterilization',
            meta: {
                options: [
                    {
                        label: 'Так',
                        value: true,
                        preIcon: 'check-flag',
                    },
                    {
                        label: 'Ні',
                        value: false,
                        preIcon: 'close',
                    }
                ]
            },
        },
        {
            label: 'Характер:',
            type: 'custom-character',
            name: 'character_short',
            meta: {
                options: [
                    {
                        label: '😃',
                        value: '😃',
                    },
                    {
                        label: '😇',
                        value: '😇',
                    },
                    {
                        label: '😜',
                        value: '😜',
                    },
                    {
                        label: '😎',
                        value: '😎',
                    },
                    {
                        label: '😝',
                        value: '😝',
                    }
                ]
            },
        },
        {
            label: 'Опис характеру:',
            type: 'textarea',
            name: 'character',
            meta: {
                rows: 6,
                maxlength: 75,
                placeholder: 'Грайливий та веселий песик...',
            },
        },
        {
            label: 'Історія життя:',
            type: 'custom-lifestory',
            name: 'lifestory',
            meta: {
                max: 100,
                maxlength: 75,
            },
        },
        {
            label: 'Вакцинація:',
            type: 'checkbox',
            name: 'vaccination',
            meta: {
                options: options.vaccinations
            },
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

<EditCard {withButtons} form="animal-form" on:cancel={onCancel}>
    <FormBuilder 
        id="animal-form"
        items={formFields}
        data={formValues}
        errors={formErrors}
        submit={onSubmit}
        on:change
        let:item={item}
        let:value={value}
        let:onChange={onChange}
    >
        {#if item.type === 'custom-character'}
            <section>
                <h2 class="text-left">
                    { item.label }
                    <Br size="10"/>
                </h2>
                <div class="flex flex-justify-center">
                    <RadioRect
                        {...item.meta}
                        {value}
                        name={item.name}
                        let:item={radio}
                        on:change={onChange}
                    >
                        <Square 
                            style="width: calc(40px + (50 - 40) * ((100vw - 320px) / (375 - 320))); max-width: 50px"
                            class="flex flex-align-center flex-justify-center"
                        >
                            <span class="max-full-height h1 flex-1 flex flex-align-center flex-justify-center">
                                { radio.label }
                            </span>
                        </Square>
                    </RadioRect>
                </div>
            </section>

        {:else if item.type === 'custom-lifestory'}
            <section>
                <StoryList
                    {...item.meta}
                    {value}
                    name={item.name}
                    label={item.label}
                    on:change={onChange}
                />
            </section>
        {/if}
    </FormBuilder>
</EditCard>


