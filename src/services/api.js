import zlFetch from 'zl-fetch' // See: https://github.com/zellwk/zl-fetch
import { setup, endpoints } from '@config'

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

    this._base_path = config.basePath ? config.basePath.replace(/\/$/, '') : ''

    this._requestInterceptor = config.requestInterceptor || (async (...args) => args)
    this._responseInterceptor = config.responseInterceptor || (async (...args) => args)
    this._errorInterceptor = config.errorInterceptor || Promise.reject
  }

  /**
   *
   * @param method {'get'|'put'|'post'|'delete'|'patch'}
   * @param args {*[]}
   */
  get newRequest() {
    const methods = ['get', 'put', 'post', 'delete', 'patch']

    return methods.reduce((acc, method) => {
      acc[method] = this.withInterceptors.bind(this, this._adapter[method], method)
      return acc
    }, {})
  }

  async withInterceptors(caller, method, ...args) {
    const newArgs1 = await this.requestInterceptor(...args)
    const newArgs2 = await this._requestInterceptor(...newArgs1)

    const path = newArgs2[0]
    const body = method !== 'get' ? newArgs2[1] : null
    const queries = method === 'get' ? newArgs2[1] : null
    const config = { ...newArgs2[2], body, queries }

    return caller(path, config)
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
      args[0] = `${this._base_path}/${args[0]}`
    }
    return [...args]
  }

  async handleResponse(response) {
    return response.body.data
  }

  async handleReject(reject) {
    throw (reject || {}).error || reject
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
   * @description Users
   */
  getUser(id, params, config) {
    return this.newRequest.get(endpoints.USER(id), params, config)
  }

  getUsers(params, config) {
    return this.newRequest.get(endpoints.USERS(), params, config)
  }

  postUser(body, config) {
    return this.newRequest.post(endpoints.USERS(), body, config)
  }

  putUser(id, body, config) {
    return this.newRequest.put(endpoints.USER(id), body, config)
  }

  deleteUser(id, config) {
    return this.newRequest.delete(endpoints.USER(id), config)
  }

  /**
   *
   * @description News
   */
  getArticle(id, params, config) {
    return this.newRequest.get(endpoints.ARTICLE(id), params, config)
  }

  getArticles(params, config) {
    return this.newRequest.get(endpoints.ARTICLES(), params, config)
  }

  getArticlesByFund(fund_id, params, config) {
    return this.newRequest.get(endpoints.ARTICLES(), { ...params, fund_id }, config)
  }

  getArticlesByOrg(organization_id, params, config) {
    return this.newRequest.get(endpoints.ARTICLES(), { ...params, organization_id }, config)
  }

  postArticle(body, config) {
    return this.newRequest.post(endpoints.ARTICLES(), body, config)
  }

  putArticle(id, body, config) {
    return this.newRequest.put(endpoints.ARTICLE(id), body, config)
  }

  deleteArticle(id, config) {
    return this.newRequest.delete(endpoints.ARTICLE(id), config)
  }

  /**
   *
   * @description Pet
   */
  getPet(id, params, config) {
    return this.newRequest.get(endpoints.PET(id), params, config)
  }

  getPetsByFund(fund_id, params, config) {
    return this.newRequest.get(endpoints.PETS(), { ...params, fund_id }, config)
  }

  getPetsByOrg(organization_id, params, config) {
    return this.newRequest.get(endpoints.PETS(), { ...params, organization_id }, config)
  }

  postPet(body, config) {
    return this.newRequest.post(endpoints.PETS(), body, config)
  }

  putPet(id, body, config) {
    return this.newRequest.put(endpoints.PET(id), body, config)
  }

  deletePet(id, config) {
    return this.newRequest.delete(endpoints.PET(id), config)
  }

  /**
   *
   * @description Donators
   */
  getDonatorsByFund(fund_id, params, config) {
    return this.newRequest.get(endpoints.DONATORS(), { ...params, fund_id }, config)
  }

  getDonatorsByOrg(organization_id, params, config) {
    return this.newRequest.get(endpoints.DONATORS(), { ...params, organization_id }, config)
  }

  /**
   *
   * @description Comments
   */
  getComment(id, params, config) {
    return this.newRequest.get(endpoints.COMMENT(id), params, config)
  }

  getCommentsByFund(fund_id, params, config) {
    return this.newRequest.get(endpoints.COMMENTS(), { ...params, fund_id }, config)
  }

  getCommentsByOrg(organization_id, params, config) {
    return this.newRequest.get(endpoints.COMMENTS(), { ...params, organization_id }, config)
  }

  postComment(body, config) {
    return this.newRequest.post(endpoints.COMMENTS(), body, config)
  }

  putComment(id, body, config) {
    return this.newRequest.put(endpoints.COMMENT(id), body, config)
  }

  deleteComment(id, config) {
    return this.newRequest.delete(endpoints.COMMENT(id), config)
  }

  /**
   *
   * @description Fund
   */
  getFund(id, params, config) {
    return this.newRequest.get(endpoints.FUND(id), params, config)
  }

  getFunds(id, params, config) {
    return this.newRequest.get(endpoints.FUNDS(), params, config)
  }

  getFundsByOrg(organization_id, params, config) {
    return this.newRequest.get(endpoints.FUNDS(), { ...params, organization_id }, config)
  }

  postFund(body, config) {
    return this.newRequest.post(endpoints.FUNDS(), body, config)
  }

  putFund(id, body, config) {
    return this.newRequest.put(endpoints.FUND(id), body, config)
  }

  deleteFund(id, config) {
    return this.newRequest.delete(endpoints.FUND(id), config)
  }

  /**
   *
   * @description Organization
   */
  getOrganization(id, params, config) {
    return this.newRequest.get(endpoints.ORGANIZATION(id), params, config)
  }

  getOrganizations(id, params, config) {
    return this.newRequest.get(endpoints.ORGANIZATIONS(), params, config)
  }

  getOrganizationByFund(fund_id, params, config) {
    return this.newRequest.get(endpoints.ORGANIZATIONS(), { ...params, fund_id }, config)
  }

  getOrganizations(params, config) {
    return this.newRequest.get(endpoints.ORGANIZATIONS(), params, config)
  }

  postOrganization(body, config) {
    return this.newRequest.post(endpoints.ORGANIZATIONS(), body, config)
  }

  putOrganization(id, body, config) {
    return this.newRequest.put(endpoints.ORGANIZATION(id), body, config)
  }

  deleteOrganization(id, config) {
    return this.newRequest.delete(endpoints.ORGANIZATION(id), config)
  }

  /**
   *
   * @description Media
   */
  uploadImage(body, config) {
    return this.newRequest.post(endpoints.IMAGES_UPLOAD(), body, config)
  }

}

/**
 *
 * @constructor {Config}
 */
export default new ApiClass({
  basePath: setup.BACKEND_URL,
  responseInterceptor: res => (console.info('response -------\n', res), res),
  errorInterceptor: rej => {
    console.warn('request error -------\n', rej)

    if (rej && rej.error && rej.error.message === 'Failed to fetch') {
      console.log('Lost internet connection')
      showOfflineMessage()
    }

    throw rej
  },
})

function showOfflineMessage() {
  try {
    let timer = null
    const offlineEl = document.querySelector('#offline-message')
    if (!timer) {
      offlineEl.classList.add('active')
      timer = setTimeout(() => {
        offlineEl.classList.remove('active')
        clearTimeout(timer)
      }, 5000)
    }
  } catch (err) {
    console.warn(err)
  }
}
