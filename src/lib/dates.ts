// One place for "what day is it", because the app has two conventions and
// mixing them is silently wrong.
//
// Habit dates are `YYYY-MM-DD` strings meaning a LOCAL calendar day: that is
// what `habitStore`, `History` and `habitMath` all store and compare. The
// workout records hook used `toISOString().split('T')[0]` instead, which is the
// UTC day. West of UTC those diverge every evening — a lift logged after 5pm
// Pacific was filed under tomorrow, so it did not match today's row and its
// "previous best" lookup (which excludes today by date) still counted the sets
// logged earlier the same evening.
//
// Everything that needs a day key should come through here.

import { format } from 'date-fns';

/** The local calendar day of `date`, as `YYYY-MM-DD`. */
export const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

/** Today's local calendar day, as `YYYY-MM-DD`. */
export const todayKey = (): string => toDateKey(new Date());
