<script>
    import { OrganizationButton } from '../components'

    export let organization
</script>

<OrganizationButton id={organization.id} src={organization.avatar} title={organization.name}/>
