<script>
    import { Br, Avatar, Loader, FormBuilder } from '@components'

    export let src
    export let title
    export let subtitle
    // export let itemsX
    // export let itemsY

    let formValues = {

    }

    let formErrors = {
        pwd: 'Обов\'язкове поле',
        full_name: 'Мало символів',
    }

    let formFields = [
        {
            label: 'Моє ім\'я:',
            type: 'text',
            name: 'name',
            meta: {
                placeholder: 'Віталій Бублик',
            },
        },
        {
            label: 'Email:',
            type: 'email',
            name: 'email',
            meta: {
                placeholder: 'mylovedmail@gmail.com',
            },
        },
        // {
        //     label: 'Телефон:',
        //     type: 'tel',
        //     name: 'phone',
        //     meta: {
        //         placeholder: '+380974354532',
        //     },
        // },
        {
            label: 'Місто:',
            type: 'text',
            name: 'ship-city',
            meta: {
                placeholder: 'Львів...',
            }
        },
        {
            label: 'Пароль:',
            type: 'password',
            name: 'new-password',
            meta: {
                minlength: 8,
                required: 'required',
                placeholder: 'Введіть пароль...',
            },
        },
        {
            label: 'Організація:',
            type: 'select',
            name: 'organization',
            meta: {
                placeholder: 'Виберіть організацію...',
                options: [
                    {
                        value: '',
                        label: 'Вибрати...',
                    },
                    {
                        value: 'org1',
                        label: 'Дім Сірка',
                    },
                    {
                        value: 'org2',
                        label: 'Милосердя',
                    },
                    {
                        value: 'org3',
                        label: 'Добрі люди',
                    }
                ]
            },
        },
        {
            label: 'Опис фонду:',
            type: 'textarea',
            name: 'description',
            meta: {
                rows: 6,
                placeholder: 'Збираємо гроші на допомогу...',
            },
        },
        {
            label: 'День народження:',
            type: 'date',
            name: 'bday',
            meta: {
                pattern: "\\d{4}-\\d{2}-\\d{2}",
                placeholder: '10.10.2010',
                min: "2020-04-01",
                max: "2020-05-30",
            },
        },
        {
            label: 'Стать:',
            type: 'radio',
            name: 'sex',
        },
    ]
</script>

<div class="text-center flex flex-column flex-align-center">
    <span>
        <Avatar size="big" {src} alt="Організація"/>
    </span>

    <Br size="20"/>

    {#if title !== undefined}
    {#if title !== null}
        <h2>{title}</h2>
    {:else}
        <div style="width: 200px"><Loader type="h2"/></div>
    {/if}
    {/if}
    <Br size="4"/>
    {#if title !== undefined}
    {#if title !== null}
        <p>{subtitle}</p>
    {:else}
        <div style="width: 100px"><Loader type="p"/></div>
    {/if}
    {/if}

    <Br size="40"/>
    <section class="full-width">

<!--        <FormBuilder-->
<!--                id="usrForm"-->
<!--                items={formFields}-->
<!--                data={formValues}-->
<!--                errors={formErrors}-->
<!--        />-->

        <form method="post" id="usrForm">
            <fieldset>
                <legend>Contact Info</legend>
                <label for="frmNameA">Name</label>
                <input name="fname" id="frmNameA" placeholder="Full name" required="" autocomplete="fname">
                <label for="frmEmailA">Email</label>
                <input type="email" name="email" id="frmEmailA" placeholder="name@example.com" required="" autocomplete="email">
                <label for="frmEmailC">Confirm Email</label>
                <input type="email" name="emailC" id="frmEmailC" placeholder="name@example.com" required="" autocomplete="email">
                <label for="frmPhoneNumA">Phone</label>
                <input type="tel" name="phone" id="frmPhoneNumA" placeholder="+1-650-450-1212" required="" autocomplete="tel">

                <datalist id="chocType">
                    <option value="white">
                    </option><option value="milk">
                </option><option value="dark"></option></datalist>
            </fieldset>
            <fieldset>
                <legend>Shipping</legend>
                <label for="frmAddressS">Address</label>
                <input name="ship-address" required="" id="frmAddressS" placeholder="123 Any Street" autocomplete="shipping street-address">
                <label for="frmCityS">City</label>
                <input name="ship-city" required="" id="frmCityS" placeholder="New York" autocomplete="shipping address-level2">
                <label for="frmStateS">State</label>
                <input name="ship-state" required="" id="frmStateS" placeholder="NY" autocomplete="shipping address-level1">
                <label for="frmZipS">Zip</label>
                <input name="ship-zip" required="" id="frmZipS" placeholder="10011" autocomplete="shipping postal-code">
                <label for="frmCountryS">Country</label>
                <input name="ship-country" required="" id="frmCountryS" placeholder="USA" autocomplete="shipping country">

                <label>
                    <input type="checkbox" name="billAndShip" id="cbBillAndShip">
                    <br>Bill to this address.</label>
            </fieldset>
            <fieldset>
                <legend>Billing</legend>
                <label for="frmAddressB">Address</label>
                <input name="bill-address" id="frmAddressB" required="" placeholder="123 Any Street" autocomplete="billing street-address">
                <label for="frmCityB">City</label>
                <input name="bill-city" id="frmCityB" required="" placeholder="New York" autocomplete="billing address-level2">
                <label for="frmStateB">State</label>
                <input name="bill-state" id="frmStateB" required="" placeholder="NY" autocomplete="billing address-level1">
                <label for="frmZipB">Zip</label>
                <input name="bill-zip" id="frmZipB" required="" placeholder="10011" autocomplete="billing postal-code">
                <label for="frmCountryB">Country</label>
                <input name="bill-country" id="frmCountryB" required="" placeholder="USA" autocomplete="billing country"></fieldset>

            <div id="paymentSec">
                <fieldset>
                    <legend>Payment</legend>
                    <p>
                        Do <b>NOT</b>
                        provide real credit card information in this field.
                    </p>
                    <label for="frmNameCC">Name on card</label>
                    <input name="ccname" id="frmNameCC" required="" placeholder="Full Name" autocomplete="cc-name">
                    <label for="frmCCNum">Card Number</label>
                    <input name="cardnumber" id="frmCCNum" required="" autocomplete="cc-number">
                    <label for="frmCCCVC">CVC</label>
                    <input name="cvc" id="frmCCCVC" required="" autocomplete="cc-csc">
                    <label for="frmCCExp">Expiry</label>
                    <input name="cc-exp" id="frmCCExp" required="" placeholder="MM-YYYY" autocomplete="cc-exp">
                    <div>
                        <button class="btn" id="butCheckout">Check Out</button>
                    </div>
                </fieldset>
            </div>
        </form>

        <button type="submit" form="user-form">Зберегти</button>
    </section>
</div>
