<script>
    import { safeGet } from "@utils";
    import { ContactsCard } from '../components'

    export let contacts
    export let organization
</script>

<ContactsCard 
    items={contacts}
    orgName={safeGet(() => organization.name)}
    avatar={safeGet(() => organization.logo)}
/>

