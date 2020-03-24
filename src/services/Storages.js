
import Storages from 'js-storage'
import Cookies from 'js-cookie'

Storages.alwaysUseJsonInStorage()

export const localStorage = Storages.localStorage
export const sessionStorage = Storages.sessionStorage
export const cookieStorage = Cookies

export default Storages