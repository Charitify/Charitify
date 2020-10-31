<script>
    import { safeGet } from "@utils";
    import { ContactsCard } from '../components'

    export let contacts
    export let organization
</script>

<ContactsCard 
    items={contacts}
    orgName={safeGet(() => organization.title)}
    avatar={safeGet(() => organization.avatar)}
    avatarBig={safeGet(() => organization.avatarBig)}
/>

