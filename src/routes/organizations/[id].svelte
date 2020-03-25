<script>
  import { stores } from "@sapper/app";
  import { onMount } from "svelte";
  import { API } from "@services";
  import {
    Br,
    Icon,
    Card,
    Avatar,
    Button,
    Footer,
    Picture,
    Progress,
    Comments,
    Carousel,
    FancyBox,
    NewsList,
    Documents,
    TrustButton,
    DonatorsList,
    CharityCards,
    DonationButton
  } from "@components";

  const { page } = stores();

  // Organization
  let organizationId = $page.params.id;
  let organization = {};
  $: carousel = (organization.avatars || []).map(p => ({
    src: p,
    alt: "photo"
  }));
  onMount(async () => {
    organization = await API.getOrganization(1);
  });

  // Trust button
  let active = false;
  async function onClick() {
    active = !active;
  }

  // Carousel & FancyBox
  let propsBox = {};
  function onCarouselClick({ detail }) {
    propsBox = { initIndex: detail.index };
  }

  // Avatar fancy
  let avatarFancy = false;
</script>

<style>

</style>

<svelte:head>
  <title>Charitify - Organization page.</title>
</svelte:head>

<section class="container theme-bg-color-secondary">
  <Br size="var(--header-height)" />
  <Br size="30" />

  <Button class="white">
    <div class="flex flex-align-center flex-justify-between full-width">
      <div class="flex flex-align-center">
        <s />
        <div
          class="flex"
          style="max-width: 45px; height: 40px; overflow: hidden">
          <Picture src="./assets/dimsirka.jpg" size="contain" alt="logo" />
        </div>
        <s />
        <s />
        <s />
        <h3>"Дім Сірка"</h3>
      </div>
    </div>
  </Button>
  <Br size="20" />

  a

  <section class="flex" style="height: 240px">
    <FancyBox>
      <Carousel items={carousel} on:click={onCarouselClick} dotsBelow={false} />
      <div slot="box">
        <Carousel {...propsBox} items={carousel} dotsBelow={false} />
      </div>
    </FancyBox>
  </section>
  <Br size="60" />

  <h2>Організація Добра</h2>
  <Br size="10" />
  <pre class="font-w-300">
    Організація Добра – благодійний фонд, який опікується долею безпритульних
    котиків та песиків. Пропонуємо вам відвідати наш притулок, який знаходиться
    у Львові, вул. Сахарова 3
  </pre>
  <Br size="10" />

  <p class="container flex flex-justify-between flex-align-center">
    <span class="flex flex-align-center">
      <Icon is="danger" type="heart-filled" size="medium" />
      <s />
      <s />
      <span class="font-secondary font-w-600 h3">1</span>
    </span>

    <span class="flex">
      <Button class="flex flex-align-center" auto size="small">
        <Icon type="share" size="medium" class="theme-svg-fill" />
        <s />
        <s />
        <h3 class="font-w-600">Поділитись</h3>
      </Button>
    </span>

    <span class="flex flex-align-center">
      <Icon type="eye" size="medium" class="theme-svg-fill" />
      <s />
      <s />
      <span class="font-secondary font-w-600 h3">13</span>
    </span>
  </p>
  <Br size="50" />

  <h1>Фонди тварин</h1>
  <Br size="5" />
  <div class="full-container">
    <CharityCards />
  </div>
  <Br size="45" />

  <h1>Інші фонди</h1>
  <Br size="5" />
  <div class="full-container">
    <CharityCards />
  </div>
  <Br size="45" />

  <h1>Про нас</h1>
  <Br size="10" />
  <pre class="font-w-300">
    Організація Добра – благодійний фонд, який опікується долею безпритульних
    котиків та песиків. Пропонуємо вам відвідати наш притулок, який знаходиться
    у Львові, вул. Сахарова 3 Організація Добра – благодійний фонд, який
    опікується долею безпритульних котиків та песиків.
  </pre>
  <Br size="10" />

  <p class="flex">
    <Button class="flex flex-align-center" auto size="small">
      <Icon type="share" size="medium" class="theme-svg-fill" />
      <s />
      <s />
      <p class="font-w-500">Поділитись</p>
    </Button>
    <s />
    <s />
    <s />
    <s />
    <s />
    <Button class="flex flex-align-center" auto size="small">
      <Icon type="link" size="medium" class="theme-svg-fill" />
      <s />
      <s />
      <p class="font-w-500">Скопіювати</p>
    </Button>
  </p>
  <Br size="50" />

  <section class="flex flex-column flex-align-center flex-justify-center">
    <div style="width: 100px; max-width: 100%">
      <TrustButton isActive={active} on:click={onClick} />
    </div>
    <Br size="10" />
    <h2>Я довіряю</h2>
  </section>
  <Br size="50" />

  <h1>Наші піклувальники</h1>
  <Br size="20" />
  <div class="full-container">
    <DonatorsList />
  </div>
  <Br size="60" />

  <h1>Останні новини</h1>
  <Br size="20" />
  <NewsList on:click={(e) => console.log(e.detail)}/>
  <Br size="60" />

  <h1>Сертифікати</h1>
  <Br size="5" />
  <div class="full-container">
    <Documents />
  </div>
  <Br size="45" />

  <h1>Відео про нас</h1>
  <Br size="20" />
  <section class="flex" style="height: 240px">
    <FancyBox>
      <Carousel items={carousel} on:click={onCarouselClick} />
      <div slot="box">
        <Carousel {...propsBox} items={carousel} />
      </div>
    </FancyBox>
  </section>
  <Br size="70" />

  <Card>
    <section class="container">
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
        <li>+38 (093) 455-32-12</li>
        <li>sergey.zastrow@gmail.com</li>
        <li>Львів, Україна</li>
      </ul>

      <Br size="30" />
    </section>
  </Card>
  <Br size="60" />

  <h1>3D - Тур 360°</h1>
  <Br size="20" />
  <div class="full-container">
    <iframe
      title="360 тур"
      src="https://www.google.com/maps/embed?pb=!4v1584897060810!6m8!1m7!1skKRg7TofqDSsrkcJRbBDug!2m2!1d48.89874683261886!2d24.75621937486022!3f291.2976377703877!4f-17.03315422439765!5f0.7820865974627469"
      width="100%"
      height="450"
      frameborder="0"
      style="border:0;"
      allowfullscreen=""
      aria-hidden="false"
      tabindex="0" />
  </div>
  <Br size="60" />

  <h1>Ми на карті</h1>
  <Br size="20" />
  <div class="full-container">
    <iframe
      title="Карта"
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d20985.072890836364!2d24.74703549119322!3d48.8937812401519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4730c391910041fd%3A0x6a789a2223e12e2d!2sBo%20Dim%20Sirka%20.%20Prytulok!5e0!3m2!1sen!2sus!4v1584897512173!5m2!1sen!2sus"
      width="100%"
      height="450"
      frameborder="0"
      style="border:0;"
      allowfullscreen=""
      aria-hidden="false"
      tabindex="0" />
  </div>
  <Br size="60" />

  <h1>Коментарі</h1>
  <Br size="5" />
  <div class="full-container">
    <Comments />
  </div>
  <Br size="40" />

  <div class="full-container">
    <Footer />
  </div>

</section>
