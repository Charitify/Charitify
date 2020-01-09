<script>
    import { Button, Picture, Input, Progress } from '../components'
</script>

<style>
    h1,
    p {
        text-align: center;
        margin: 0 auto;
    }

    h1 {
        text-transform: uppercase;
        margin: 0 0 0.5em 0;
    }

    .top-wrap {
        padding-left: 5px;
    }

    .top {
        display: flex;
    }

    .top-pic {
        display: flex;
        flex-grow: 1;
    }

    .options {
        flex: 0;
        display: flex;
        flex-direction: column;
        margin: -7px 0;
        padding: 0 10px;
    }

    .options li {
        flex: none;
        margin: 7px 0;
    }
</style>

<svelte:head>
    <title>Test Title</title>
</svelte:head>


<section class="top-wrap">
    <section class="top">
        <div class="top-pic">
            <Picture src="https://placeimg.com/1000/1000/people" alt="sample"/>
        </div>

        <ul class="options">
            <li>
                <Button is="success" on:click="{e => console.log(e)}">test1</Button>
            </li>
            <li>
                <Button is="success" on:click="{e => console.log(e)}">test12</Button>
            </li>
            <li>
                <Button is="success" on:click="{e => console.log(e)}">test123</Button>
            </li>
            <li>
                <Input
                        type="number"
                        name="num"
                        list="sum-suggestions"
                        placeholder="Num"
                        autoselect
                        align="right"
                />

                <datalist id="sum-suggestions">
                    <option value="20">
                    <option value="500">
                    <option value="1000">
                </datalist>
            </li>
        </ul>
    </section>

    <section style="padding: 20px 5px 20px 0">
        <Progress value="65" max="100" style="background: 0; width: 100%"></Progress>
    </section>
</section>


<section>

    <br>
    <br>

    <Input type="number" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="text" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="email" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="url" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="search" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="date" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="password" list="sum-suggestions"/>

    <br>
    <br>

    <Input type="tel" list="sum-suggestions"/>
</section>

<h1>Great <span class="text-success">success</span>!</h1>

<br>
<br>

<h2 class="text-success">Typography</h2>

<br>
<br>

<p>Few paragraphs to text fonts</p>
<p>Декілька параграфів для тесту тексту</p>
<p>Несколько параграфов для теста текста</p>

<br>
<br>

<h2 class="text-warning">Interactive elements</h2>

<br>
<br>

<section style="text-align: center; display: flex; justify-content: space-around">
    <div>
        <br>
        Buttons
        <br>
        <br>
        <Button on:click="{e => console.log(e)}">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" ariaLabel="text">test</Button>
        <br>
        <br>
        With text
        <Button is="success" on:click="{e => console.log(e)}">test</Button>
        and behind.
        <br>
        <br>
        <Button is="warning" on:click="{e => console.log(e)}">Some example of Button</Button>
        <br>
        <br>
        <Button is="danger" on:click="{e => console.log(e)}">Some example of Button</Button>
        <br>
        <br>
    </div>

    <div>
        <br>
        Links as buttons
        <br>
        <br>
        <Button on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        <br>
        <br>
        With text
        <Button is="success" on:click="{e => console.log(e)}" href="#">test</Button>
        and behind.
        <br>
        <br>
        <Button is="warning" on:click="{e => console.log(e)}" href="#">Some example of Button</Button>
        <br>
        <br>
        <Button is="danger" on:click="{e => console.log(e)}" href="#">Some example of Button</Button>
        <br>
        <br>
    </div>
</section>

<br>
<br>

<h2 class="text-danger">Input fields</h2>

<br>
<br>

<section>
    <Input rows={2} name="tex" list="lis"/>

    <br>
    <br>

    <Input name="tex1" list="lis" placeholder="Some placeholder text"/>

    <br>
    <br>

    <Input type="number" name="tex1" list="lis"/>

    <datalist id="lis">
        <option value="1">
        <option value="2">
        <option value="3">
    </datalist>

    <label for="input" class="text-success">label</label>
    <input id="input" type="text" value="text">

    <br>
    <br>

    <a href="." class="text-warning">Some link</a>

    <br>
    <br>

    <button type="button" class="text-info">Button example</button>
</section>

<br>
<br>

<h2 class="text-info">Images</h2>

<Picture alt="Borat" src="great-success.png" class="picture">
    HIGH FIVE!
</Picture>

<br>
<br>

<Picture src="https://placeimg.com/1000/1000/any" alt="sample"/>

<br>
<br>

<h2 class="text-success">Other</h2>

<p>
    <strong>
        Try editing this file (src/routes/index.svelte) to test live reloading.
    </strong>
</p>

<p style="text-align: justify">
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
    autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia
    nesciunt
    nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur,
    dolore
    ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint?
    Consectetur dolorum
    enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut
    autem
    commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem
    sapiente
    sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio
    reiciendis
    repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa
    iste
    nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem.
    Debitis
    illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis
    culpa
    debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt
    numquam obcaecati
    perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate
    voluptates
    voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque
    laboriosam
    laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit
    suscipit
    tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias
    amet
    corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas
    quia quidem
    quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum
    iusto
    laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda
    commodi cumque
    dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis
    quidem
    voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia
    pariatur,
    provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex
    expedita
    explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis
    possimus
    quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum
    in ipsum
    magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem
    commodi
    distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi
    suscipit
    veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit!
    Accusantium cupiditate
    eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque
    debitis
    dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis
    praesentium
    quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate
    voluptatem. Assumenda
    consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam
    architecto asperiores
    delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt
    omnis placeat
    quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia
    quisquam,
    repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis
    illo inventore
    iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi
    impedit
    laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem
    similique sit
    unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla
    officiis
    pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos,
    eius enim
    error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A
    asperiores
    at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos
    similique
    tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam
    natus, necessitatibus
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
    autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia
    nesciunt
    nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur,
    dolore
    ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint?
    Consectetur dolorum
    enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut
    autem
    commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem
    sapiente
    sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio
    reiciendis
    repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa
    iste
    nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem.
    Debitis
    illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis
    culpa
    debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt
    numquam obcaecati
    perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate
    voluptates
    voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque
    laboriosam
    laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit
    suscipit
    tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias
    amet
    corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas
    quia quidem
    quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum
    iusto
    laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda
    commodi cumque
    dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis
    quidem
    voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia
    pariatur,
    provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex
    expedita
    explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis
    possimus
    quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum
    in ipsum
    magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem
    commodi
    distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi
    suscipit
    veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit!
    Accusantium cupiditate
    eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque
    debitis
    dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis
    praesentium
    quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate
    voluptatem. Assumenda
    consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam
    architecto asperiores
    delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt
    omnis placeat
    quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia
    quisquam,
    repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis
    illo inventore
    iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi
    impedit
    laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem
    similique sit
    unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla
    officiis
    pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos,
    eius enim
    error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A
    asperiores
    at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos
    similique
    tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam
    natus, necessitatibus
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
    autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia
    nesciunt
    nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur,
    dolore
    ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint?
    Consectetur dolorum
    enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut
    autem
    commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem
    sapiente
    sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio
    reiciendis
    repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa
    iste
    nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem.
    Debitis
    illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis
    culpa
    debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt
    numquam obcaecati
    perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate
    voluptates
    voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque
    laboriosam
    laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit
    suscipit
    tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias
    amet
    corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas
    quia quidem
    quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum
    iusto
    laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda
    commodi cumque
    dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis
    quidem
    voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia
    pariatur,
    provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex
    expedita
    explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis
    possimus
    quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum
    in ipsum
    magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem
    commodi
    distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi
    suscipit
    veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit!
    Accusantium cupiditate
    eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque
    debitis
    dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis
    praesentium
    quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate
    voluptatem. Assumenda
    consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam
    architecto asperiores
    delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt
    omnis placeat
    quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia
    quisquam,
    repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis
    illo inventore
    iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi
    impedit
    laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem
    similique sit
    unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla
    officiis
    pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos,
    eius enim
    error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A
    asperiores
    at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos
    similique
    tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam
    natus, necessitatibus
</p>
