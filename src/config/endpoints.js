
/**
 *
 * @description API URLs builders.
 */
export default {
    USER: (id) => `users/${id || ':id'}`,
    USERS: () => `users`,
  
    RECENT: (id) => `recents/${id || ':id'}`,
    RECENTS: () => `recents`,
  
    COMMENT: (id) => `comments/${id || ':id'}`,
    COMMENTS: () => `comments`,
  
    FUND: (id) => `funds/${id || ':id'}`,
    FUNDS: () => `funds`,
  
    ORGANIZATION: (id) => `organizations/${id || ':id'}`,
    ORGANIZATIONS: () => `organizations`,
  }
  