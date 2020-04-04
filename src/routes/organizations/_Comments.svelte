<script>
  import { Br, Comments } from "@components";

  export let items = []
</script>

<h1>Коментарі</h1>
<Br size="5" />
<div class="full-container">
  <Comments {items}/>
</div>
