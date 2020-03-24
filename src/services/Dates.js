
import dayjs from 'dayjs'

import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import weekday from 'dayjs/plugin/weekday'

import 'dayjs/locale/en' // load on demand
import 'dayjs/locale/ru' // load on demand
import 'dayjs/locale/uk' // load on demand

dayjs.extend(relativeTime) // use RelativeTime pluggin
dayjs.extend(utc) // use UTC pluggin
dayjs.extend(weekday) // use Weekday pluggin

dayjs.locale('en') // use Engllish
dayjs.locale('ru') // use Russian
dayjs.locale('uk') // use Ukrainian

export default dayjs
