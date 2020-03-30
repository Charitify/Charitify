<script>
  import { Picture } from "@components";

  export let organization = {}
</script>

<a
  rel="prefetch"
  href={organization.id}
  class="btn white full-width"
  style="padding: 5px 15px;"
>
  <div class="flex flex-align-center flex-justify-between full-width">
    <div class="flex flex-align-center">
      <s />
      <div class="flex" style="max-width: 45px; height: 40px; overflow: hidden">
        <Picture
          src={organization.avatar}
          size="contain"
          alt="фото організації" />
      </div>
      <s />
      <s />
      <s />
      <h3>{organization.name}</h3>
    </div>
    <span style="font-size: 24px">→</span>
  </div>
</a>
