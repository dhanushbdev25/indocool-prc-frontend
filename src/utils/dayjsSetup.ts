import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { APP_TIMEZONE } from './dateConfig';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(APP_TIMEZONE);

export default dayjs;
