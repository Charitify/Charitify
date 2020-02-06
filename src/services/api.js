import zlFetch from 'zl-fetch' // See: https://github.com/zellwk/zl-fetch

/**
 *
 * @description API URLs builders.
 */
export const endpoints = {
  BASE_URL: './mock/',

  CHARITY: (id) => `${endpoints.BASE_URL}charity.json?id=${id}`,
  CHARITIES: () => `${endpoints.BASE_URL}charities.json`,
  CHARITY_COMMENTS: (id) => `${endpoints.BASE_URL}charity_comments.json?id=${id}`,

  ORGANIZATION: (id) => `${endpoints.BASE_URL}organization.json?id=${id}`,
  ORGANIZATIONS: () => `${endpoints.BASE_URL}organizations.json`,
  ORGANIZATION_COMMENTS: (id) => `${endpoints.BASE_URL}organization_comments.json?id=${id}`,

  RECENT_NEWS: () => `${endpoints.BASE_URL}recent_news.json`,
}

class APIService {
  constructor() {
    this._localConfig = {}
    this._adapter = zlFetch
  }

  handleResponse(response) {
    return response.body
  }

  handleReject(reject) {
    throw reject
  }
}

/**
 *
 * @description API class for making REST API requests in a browser.
 */
export default new class extends APIService {
  constructor() {
    super()
  }

  getCharity(id, params, config) {
    return this._adapter.get(endpoints.CHARITY(id), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }
  getCharities(params, config) {
    return this._adapter.get(endpoints.CHARITIES(), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }
  getCharityComments(id, params, config) {
    return this._adapter.get(endpoints.CHARITY_COMMENTS(id), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }

  getOrganization(id, params, config) {
    return this._adapter.get(endpoints.ORGANIZATION(id), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }
  getOrganizations(params, config) {
    return this._adapter.get(endpoints.ORGANIZATIONS(), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }
  getOrganizationComments(id, params, config) {
    return this._adapter.get(endpoints.ORGANIZATION_COMMENTS(id), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }

  getRecentNews(params, config) {
    return this._adapter.get(endpoints.RECENT_NEWS(), params, { ...this._localConfig, ...config })
      .then(this.handleResponse)
      .catch(this.handleReject)
  }

}
