<script>
  import { Button } from '../components'
</script>

<style>
  h1,
  figure,
  p {
    text-align: center;
    margin: 0 auto;
  }

  h1 {
    text-transform: uppercase;
    margin: 0 0 0.5em 0;
  }

  figure {
    margin: 0 0 1em 0;
  }

  img {
    position: sticky;
    top: 70px;
    display: inline-block;
    width: 100%;
    max-width: 400px;
    margin: 0 0 1em 0;
  }
</style>

<svelte:head>
  <title>Sapper project template</title>
</svelte:head>

<h1>Great <span class="text-success">success</span>!</h1>


<p>Few paragraphs to text fonts</p>
<p>Декілька параграфів для тесту тексту</p>
<p>Несколько параграфов для теста текста</p>

<section>
  <h2 class="text-danger">Interactive elements</h2>

  <label for="input" class="text-success">label</label>
  <input id="input" type="text" value="text">

  <a href="." class="text-warning">Some link</a>

  <button type="button" class="text-info">Button example</button>
</section>

<section style="text-align: center">
  <br>
  <Button is="success" on:click="{e => console.log(e)}">50грн</Button>
  <br>
  <br>
  <Button is="success" on:click="{e => console.log(e)}">100грн</Button>
  <br>
  <br>
  <Button is="success" on:click="{e => console.log(e)}">200грн</Button>
  <br>
  <br>
  <Button is="warning" on:click="{e => console.log(e)}">Some example of Button</Button>
  <br>
  <br>
  <Button is="danger" on:click="{e => console.log(e)}">Some example of Button</Button>
  <br>
  <br>
</section>

<figure>
  <img alt="Borat" src="great-success.png" />
  <figcaption>HIGH FIVE!</figcaption>
</figure>

<p>
  <strong>
    Try editing this file (src/routes/index.svelte) to test live reloading.
  </strong>
</p>

<p style="text-align: justify">
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
  autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia nesciunt
  nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur, dolore
  ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint? Consectetur dolorum
  enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut autem
  commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem sapiente
  sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio reiciendis
  repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa iste
  nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem. Debitis
  illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis culpa
  debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt numquam obcaecati
  perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate voluptates
  voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque laboriosam
  laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit suscipit
  tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias amet
  corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas quia quidem
  quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum iusto
  laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda commodi cumque
  dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis quidem
  voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia pariatur,
  provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex expedita
  explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis possimus
  quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum in ipsum
  magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem commodi
  distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi suscipit
  veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit! Accusantium cupiditate
  eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque debitis
  dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis praesentium
  quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate voluptatem. Assumenda
  consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam architecto asperiores
  delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt omnis placeat
  quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia quisquam,
  repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis illo inventore
  iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi impedit
  laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem similique sit
  unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla officiis
  pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos, eius enim
  error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A asperiores
  at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos similique
  tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam natus, necessitatibus
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
  autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia nesciunt
  nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur, dolore
  ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint? Consectetur dolorum
  enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut autem
  commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem sapiente
  sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio reiciendis
  repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa iste
  nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem. Debitis
  illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis culpa
  debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt numquam obcaecati
  perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate voluptates
  voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque laboriosam
  laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit suscipit
  tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias amet
  corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas quia quidem
  quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum iusto
  laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda commodi cumque
  dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis quidem
  voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia pariatur,
  provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex expedita
  explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis possimus
  quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum in ipsum
  magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem commodi
  distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi suscipit
  veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit! Accusantium cupiditate
  eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque debitis
  dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis praesentium
  quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate voluptatem. Assumenda
  consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam architecto asperiores
  delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt omnis placeat
  quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia quisquam,
  repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis illo inventore
  iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi impedit
  laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem similique sit
  unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla officiis
  pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos, eius enim
  error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A asperiores
  at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos similique
  tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam natus, necessitatibus
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem doloribus id laborum minima. Adipisci aperiam atque
  autem commodi consequuntur debitis distinctio dolorem eum expedita ipsam iure labore laudantium maiores mollitia nesciunt
  nostrum optio perferendis porro, possimus quas quasi quisquam sint sunt totam unde. A atque blanditiis consequatur, dolore
  ducimus et id ipsam iusto labore, laudantium libero minus nam nostrum, numquam praesentium quisquam sint? Consectetur dolorum
  enim ex ipsum nam necessitatibus nisi nostrum odio omnis, quia recusandae temporibus totam. A aliquam, assumenda aut autem
  commodi consectetur dignissimos ducimus eius eos error ipsa ipsam molestias mollitia numquam praesentium quod rem sapiente
  sed sint totam! Ab aspernatur at culpa debitis dolores ea eius, excepturi ipsa laborum, minus numquam, optio reiciendis
  repudiandae similique temporibus! Blanditiis consequatur, dignissimos dolores eaque excepturi hic inventore ipsa iste
  nemo obcaecati provident quia, quibusdam ratione reiciendis saepe sequi vel veritatis vitae voluptate voluptatem. Debitis
  illum quaerat velit voluptatibus. A accusamus ad adipisci animi, aperiam architecto aspernatur aut beatae corporis culpa
  debitis dicta distinctio dolorem ducimus ea eligendi eos eveniet excepturi harum ipsum magnam maxime nesciunt numquam obcaecati
  perferendis, provident quaerat qui ratione reiciendis repellendus reprehenderit saepe sequi vel voluptas voluptate voluptates
  voluptatibus? Amet aperiam corporis deleniti deserunt, dolorem est exercitationem fuga hic impedit inventore itaque laboriosam
  laudantium, magnam necessitatibus nemo odio officiis perferendis perspiciatis quae qui quibusdam quis quod saepe sit suscipit
  tenetur ut vel veritatis voluptate voluptatibus. Aliquid cum cumque eum iure laboriosam natus rem. Accusantium alias amet
  corporis eaque enim explicabo fuga harum illo inventore itaque laudantium modi nemo nihil nulla possimus quae quas quia quidem
  quisquam recusandae repellendus sapiente sequi sit tempora, totam unde velit. Accusantium corporis cum dolor dolorum iusto
  laboriosam minus necessitatibus, nulla, omnis pariatur quae ullam voluptatem. Accusantium architecto, assumenda commodi cumque
  dignissimos doloribus eius et eum in iusto libero magnam, magni mollitia necessitatibus neque nesciunt perspiciatis quidem
  voluptas voluptatem voluptatibus? Aspernatur assumenda at consequatur deleniti eum expedita fuga in neque officia pariatur,
  provident quasi saepe sed sequi tempora tempore voluptates? Aliquam aperiam autem cum doloribus ducimus enim eum ex expedita
  explicabo id illo iste iure maiores modi nemo neque nisi nostrum officia officiis omnis perferendis perspiciatis possimus
  quae quas quibusdam quidem quis saepe sed sint sunt velit, vero vitae voluptatum? Amet debitis, dolore dolores eum in ipsum
  magnam mollitia nostrum quas quisquam quod rem sed sequi tenetur, voluptatibus. Ad adipisci aliquam animi aut autem commodi
  distinctio dolor eveniet impedit in iusto magni neque, odit optio pariatur placeat quaerat quo rem rerum sequi suscipit
  veniam vero voluptate voluptatem, voluptatum. Accusantium dicta dolores ea est libero rerum sapiente sit! Accusantium cupiditate
  eum ex molestiae praesentium provident saepe? Eveniet labore, rem. Aperiam, architecto at consectetur culpa cumque debitis
  dolorum eius eveniet fuga illo, in ipsum libero molestias necessitatibus nemo neque omnis perferendis perspiciatis praesentium
  quasi qui quia quod rerum saepe sed similique sunt suscipit tenetur totam ullam veritatis vitae voluptate voluptatem. Assumenda
  consequatur corporis dolorem doloremque ea inventore iusto sequi sit ut vitae! Adipisci alias aliquid aperiam architecto asperiores
  delectus dolore eaque eius eligendi fugiat incidunt ipsam iusto laborum magni maxime nam, necessitatibus nesciunt omnis placeat
  quaerat quibusdam rem, suscipit unde vel, veritatis vero voluptatum. Animi aut fuga impedit nostrum odit officia quisquam,
  repudiandae saepe suscipit voluptates! Ab autem beatae distinctio, dolorum eligendi est excepturi facere facilis illo inventore
  iure minus nemo nesciunt quaerat quibusdam repellendus sequi sint sit ullam voluptatem. Debitis ducimus excepturi impedit
  laudantium magnam nisi possimus, quae quod repellat sed sit tempora unde. Delectus eius laudantium quas quidem similique sit
  unde voluptas voluptate? Accusamus aut distinctio dolorum earum enim illo illum incidunt iure magni natus nulla officiis
  pariatur perspiciatis possimus quasi recusandae sint voluptas, voluptatibus. Ad aliquam amet, deleniti dignissimos, eius enim
  error excepturi hic magni quae qui quisquam repellendus rerum saepe similique suscipit temporibus vel voluptate. A asperiores
  at, dolores eligendi eum facere fuga impedit incidunt ipsam labore laborum magnam omnis placeat, quam quidem quos similique
  tenetur totam, vero voluptatibus. Ab asperiores autem cum delectus dicta dolor dolorum eos ex impedit libero nam natus, necessitatibus
</p>
