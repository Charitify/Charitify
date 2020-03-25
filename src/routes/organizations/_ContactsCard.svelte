<script>
    import { Br, Card, Icon, Avatar } from '@components'
</script>

<Card>
    <section style="padding: 0 20px">
        <Br size="30" />

        <div class="flex flex-column flex-align-center">
            <Avatar size="big" src="https://placeimg.com/300/300/people" />
            <Br size="20" />
            <h2>Наші контакти</h2>
            <Br size="5" />
            <p class="h3 font-secondary font-w-500" style="opacity: .7">
                Організація Добра
            </p>
        </div>

        <Br size="30" />

        <ul>
            <li>
                <a href="tel:+38(093)455-32-12" class="flex flex-align-center" style="padding: 7px 0">
                    <Icon type="phone-filled" size="medium" is="dark"/>
                    <s></s>
                    <s></s>
                    <s></s>
                    <p class="h3">+38 (093) 455-32-12</p>
                </a>
            </li>
            <li>
                <a href="mailto:sergey.zastrow@gmail.com" class="flex flex-align-center" style="padding: 7px 0">
                    <Icon type="email" size="medium" is="dark"/>
                    <s></s>
                    <s></s>
                    <s></s>
                    <p class="h3">sergey.zastrow@gmail.com</p>
                </a>
            </li>
            <li>
                <a href="http://maps.google.com/?daddr=Львів,+Україна" target="_blank" class="flex flex-align-center" style="padding: 7px 0">
                    <Icon type="location-mark-filled" size="medium" is="dark"/>
                    <s></s>
                    <s></s>
                    <s></s>
                    <p class="h3">Львів, Україна</p>
                </a>
            </li>
        </ul>

        <Br size="30" />

        <ul class="flex flex-justify-center social-icons">
            <li style="padding: 0 10px" class="telegram">
                <a href="https://t.me/technofrendz" target="_blank">
                    <Icon type="telegram" size="large" class="custom"/>
                </a>
            </li>
            <li style="padding: 0 10px" class="facebook">
                <a href="https://www.facebook.com/groups/3544553825618540" target="_blank">
                    <Icon type="facebook" size="large" class="custom"/>
                </a>
            </li>
            <li style="padding: 0 10px" class="viber">
                <a href="viber://forward?text=Check%20this%20out%3A%20%20https%3A%2F%2Fwww.viber.com%2Fblog%2F2017-06-25%2Finvite-friends-your-group-chat%2F" target="_blank">
                    <Icon type="viber" size="large" class="custom"/>
                </a>
            </li>
        </ul>

        <Br size="30" />
    </section>
</Card>

<style>
    .social-icons .telegram * {
        fill: #2197D2;
    }
    .social-icons .facebook * {
        fill: #4267B2;
    }
    .social-icons .viber * {
        fill: #665CAC;
    }
</style>
