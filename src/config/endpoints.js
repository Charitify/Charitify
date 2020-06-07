
/**
 *
 * @description API URLs builders.
 */
export default {
    USER: (id) => `user.json`,
    USERS: () => `users.json`,

    RECENT: (id) => `recent.json`,
    RECENTS: () => `recents.json`,

    COMMENT: (id) => `comment.json`,
    COMMENTS: () => `comments.json`,

    FUND: (id) => `fund.json`,
    FUNDS: () => `funds.json`,

    ORGANIZATION: (id) => `organization.json`,
    ORGANIZATIONS: () => `organizations.json`,
}
// export default {
//     USER: (id) => `apiusers/${id || ':id'}`,
//     USERS: () => `apiusers`,
//
//     RECENT: (id) => `apirecents/${id || ':id'}`,
//     RECENTS: () => `apirecents`,
//
//     COMMENT: (id) => `apicomments/${id || ':id'}`,
//     COMMENTS: () => `apicomments`,
//
//     FUND: (id) => `apifunds/${id || ':id'}`,
//     FUNDS: () => `apifunds`,
//
//     ORGANIZATION: (id) => `apiorganizations/${id || ':id'}`,
//     ORGANIZATIONS: () => `apiorganizations`,
// }
