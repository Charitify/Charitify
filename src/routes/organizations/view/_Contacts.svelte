<script>
    import { ContactsCard } from '../components'

    export let contacts
    export let organization
</script>

<ContactsCard 
    items={contacts}
    orgName={organization.title}
    avatar={organization.avatar}
    avatarBig={organization.avatarBig}
/>

