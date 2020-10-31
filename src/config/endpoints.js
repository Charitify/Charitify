
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

    ARTICLE: (id) => `news/${id}`,
    ARTICLES: () => `news`,

    COMMENT: (id) => `comments/${id}`,
    COMMENTS: () => `comments`,

    PET: (id) => `pets/${id}`,
    PETS: () => `pets`,

    DONATOR: (id) => `donators/${id}`,
    DONATORS: () => `donators`,

    FUND: (id) => `funds/${id}`,
    FUNDS: () => `funds`,

    ORGANIZATION: (id) => `organizations/${id}`,
    ORGANIZATIONS: () => `organizations`,

    IMAGES_UPLOAD: () => `images/upload`,
}