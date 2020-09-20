
/**
 *
 * @description API URLs builders.
 */
export default {
    LOGIN: () => `login`,
    LOGOUT: () => `logout`,
    REGISTER: () => `register`,
    FACEBOOK: () => `facebook`,
    FACEBOOK_LOGIN: () => `facebook/login`,

    USER: (id) => `users/${id}`,
    USERS: () => `users`,

    RECENT: (id) => `recent/${id}`,
    RECENTS: () => `recent`,

    COMMENT: (id) => `comments/${id}`,
    COMMENTS: () => `comments`,

    FUND: (id) => `funds/${id}`,
    FUNDS: () => `funds`,

    ORGANIZATION: (id) => `organizations/${id}`,
    ORGANIZATIONS: () => `organizations`,

    IMAGES_UPLOAD: () => `images/upload`,
}