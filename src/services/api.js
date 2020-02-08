import zlFetch from 'zl-fetch' // See: https://github.com/zellwk/zl-fetch

/**
 *
 * @description API URLs builders.
 */
export const endpoints = {
  RECENT_NEWS: () => `recent_news.json`,

  CHARITY: (id) => `charity.json?id=${id}`,
  CHARITIES: () => `charities.json`,
  CHARITY_COMMENTS: (id) => `charity_comments.json?id=${id}`,

  ORGANIZATION: (id) => `organization.json?id=${id}`,
  ORGANIZATIONS: () => `organizations.json`,
  ORGANIZATION_COMMENTS: (id) => `$organization/comments.json?id=${id}`,
}

class APIService {
  /**
   *
   * @typedef Config {{
   *   adapter: Function, (zlFetch)
   *
   *   basePath: string,
   *
   *   requestInterceptor([
   *     endpoint: string,
   *     params?: object,
   *     config?: object,
   *   ]): {*},
   *   responseInterceptor() {
   *     body: {*},
   *     headers: object,
   *     response: {Response},
   *     status: number,
   *     statusText: string,
   *   },
   *   errorInterceptor() {{
   *     body: {*},
   *     headers: object,
   *     response: {Response},
   *     status: number,
   *     statusText: string,
   *   }},
   * }}
   * @param config {Config}
   */
  constructor(config = {}) {
    this._adapter = config.adapter || zlFetch

    this._base_path = config.basePath ? `${config.basePath}/` : ''

    this._requestInterceptor = config.requestInterceptor || (async (...args) => args)
    this._responseInterceptor = config.responseInterceptor || (async (...args) => args)
    this._errorInterceptor = config.errorInterceptor || Promise.reject
  }

  /**
   *
   * @param method {'get'|'put'|'post'|'delete'|'patch'}
   * @param args {*[]}
   */
  async newRequest(method, ...args) {
    return this.withInterceptors(this._adapter[method], ...args)
  }

  async withInterceptors(caller, ...args) {
    const newArgs1 = await this.requestInterceptor(...args)
    const newArgs2 = await this._requestInterceptor(...newArgs1)

    return caller(...newArgs2)
      .then(async (response) => {
        const newResponse = await this._responseInterceptor(response)
        return await this.handleResponse(newResponse)
      })
      .catch(async (reject) => {
        try {
          return await this._errorInterceptor(reject)
        } catch (error) {
          throw error
        }
      })
      .catch(this.handleReject)
  }

  async requestInterceptor(...args) {
    if (typeof args[0] === 'string') { // If URL then concat BASE_PATH.
      args[0] = `${this._base_path}${args[0]}`
    }
    return [...args]
  }

  async handleResponse(response) {
    return response.body
  }

  async handleReject(reject) {
    throw reject
  }
}

/**
 *
 * @description API class for making REST API requests in a browser.
 */
export class ApiClass extends APIService {
  /**
   *
   * @param config {Config}
   */
  constructor(config) {
    super(config)
  }

  /**
   *
   * @description Charity
   */
  getCharity(id, params, config) {
    return this.newRequest('get', endpoints.CHARITY(id), params, config)
  }

  getCharities(params, config) {
    return this.newRequest('get', endpoints.CHARITIES(), params, config)
  }

  getCharityComments(id, params, config) {
    return this.newRequest('get', endpoints.CHARITY_COMMENTS(id), params, config)
  }

  /**
   *
   * @description Organization
   */
  getOrganization(id, params, config) {
    return this.newRequest('get', endpoints.ORGANIZATION(id), params, config)
  }

  getOrganizations(params, config) {
    return this.newRequest('get', endpoints.ORGANIZATIONS(), params, config)
  }

  getOrganizationComments(id, params, config) {
    return this.newRequest('get', endpoints.ORGANIZATION_COMMENTS(id), params, config)
  }

  /**
   *
   * @description News
   */
  getRecentNews(params, config) {
    return this.newRequest('get', endpoints.RECENT_NEWS(), params, config)
  }

}

/**
 *
 * @constructor {Config}
 */
export default new ApiClass({
  basePath: process.env.BACKEND_URL,
  responseInterceptor: res => (console.info('response -------\n', res), res),
  errorInterceptor: rej => (console.warn('request error -------\n', rej), Promise.reject(rej)),
})
