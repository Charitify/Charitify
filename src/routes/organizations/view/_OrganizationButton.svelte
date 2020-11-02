<script>
    import { OrganizationButton } from '../components'

    export let organization
</script>

<OrganizationButton id={organization.id} src={organization.logo} title={organization.name}/>
