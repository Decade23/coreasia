import { perbaruiSesiPerangkat } from '../../lib/konsol/perangkat'
export default defineEventHandler(event => perbaruiSesiPerangkat(event, 'admin/auth/devices/enroll'))
