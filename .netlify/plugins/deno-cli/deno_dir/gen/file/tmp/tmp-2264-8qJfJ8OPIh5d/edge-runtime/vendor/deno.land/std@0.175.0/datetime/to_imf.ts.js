// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Formats the given date to IMF date time format. (Reference:
 * https://tools.ietf.org/html/rfc7231#section-7.1.1.1).
 * IMF is the time format to use when generating times in HTTP
 * headers. The time being formatted must be in UTC for Format to
 * generate the correct format.
 *
 * @example
 * ```ts
 * import { toIMF } from "https://deno.land/std@$STD_VERSION/datetime/to_imf.ts";
 *
 * toIMF(new Date(0)); // => returns "Thu, 01 Jan 1970 00:00:00 GMT"
 * ```
 * @param date Date to parse
 * @return IMF date formatted string
 */ export function toIMF(date) {
  function dtPad(v, lPad = 2) {
    return v.padStart(lPad, "0");
  }
  const d = dtPad(date.getUTCDate().toString());
  const h = dtPad(date.getUTCHours().toString());
  const min = dtPad(date.getUTCMinutes().toString());
  const s = dtPad(date.getUTCSeconds().toString());
  const y = date.getUTCFullYear();
  const days = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} ${h}:${min}:${s} GMT`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdG1wL3RtcC0yMjY0LThxSmZKOE9QSWg1ZC9lZGdlLXJ1bnRpbWUvdmVuZG9yL2Rlbm8ubGFuZC9zdGRAMC4xNzUuMC9kYXRldGltZS90b19pbWYudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8qKlxuICogRm9ybWF0cyB0aGUgZ2l2ZW4gZGF0ZSB0byBJTUYgZGF0ZSB0aW1lIGZvcm1hdC4gKFJlZmVyZW5jZTpcbiAqIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM3MjMxI3NlY3Rpb24tNy4xLjEuMSkuXG4gKiBJTUYgaXMgdGhlIHRpbWUgZm9ybWF0IHRvIHVzZSB3aGVuIGdlbmVyYXRpbmcgdGltZXMgaW4gSFRUUFxuICogaGVhZGVycy4gVGhlIHRpbWUgYmVpbmcgZm9ybWF0dGVkIG11c3QgYmUgaW4gVVRDIGZvciBGb3JtYXQgdG9cbiAqIGdlbmVyYXRlIHRoZSBjb3JyZWN0IGZvcm1hdC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvSU1GIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZGF0ZXRpbWUvdG9faW1mLnRzXCI7XG4gKlxuICogdG9JTUYobmV3IERhdGUoMCkpOyAvLyA9PiByZXR1cm5zIFwiVGh1LCAwMSBKYW4gMTk3MCAwMDowMDowMCBHTVRcIlxuICogYGBgXG4gKiBAcGFyYW0gZGF0ZSBEYXRlIHRvIHBhcnNlXG4gKiBAcmV0dXJuIElNRiBkYXRlIGZvcm1hdHRlZCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvSU1GKGRhdGU6IERhdGUpOiBzdHJpbmcge1xuICBmdW5jdGlvbiBkdFBhZCh2OiBzdHJpbmcsIGxQYWQgPSAyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdi5wYWRTdGFydChsUGFkLCBcIjBcIik7XG4gIH1cbiAgY29uc3QgZCA9IGR0UGFkKGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCkpO1xuICBjb25zdCBoID0gZHRQYWQoZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCkpO1xuICBjb25zdCBtaW4gPSBkdFBhZChkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpKTtcbiAgY29uc3QgcyA9IGR0UGFkKGRhdGUuZ2V0VVRDU2Vjb25kcygpLnRvU3RyaW5nKCkpO1xuICBjb25zdCB5ID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBtb250aHMgPSBbXG4gICAgXCJKYW5cIixcbiAgICBcIkZlYlwiLFxuICAgIFwiTWFyXCIsXG4gICAgXCJBcHJcIixcbiAgICBcIk1heVwiLFxuICAgIFwiSnVuXCIsXG4gICAgXCJKdWxcIixcbiAgICBcIkF1Z1wiLFxuICAgIFwiU2VwXCIsXG4gICAgXCJPY3RcIixcbiAgICBcIk5vdlwiLFxuICAgIFwiRGVjXCIsXG4gIF07XG4gIHJldHVybiBgJHtkYXlzW2RhdGUuZ2V0VVRDRGF5KCldfSwgJHtkfSAke1xuICAgIG1vbnRoc1tkYXRlLmdldFVUQ01vbnRoKCldXG4gIH0gJHt5fSAke2h9OiR7bWlufToke3N9IEdNVGA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxNQUFNLElBQVU7RUFDOUIsU0FBUyxNQUFNLENBQVMsRUFBRSxPQUFPLENBQUM7SUFDaEMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNO0VBQzFCO0VBQ0EsTUFBTSxJQUFJLE1BQU0sS0FBSyxVQUFVLEdBQUcsUUFBUTtFQUMxQyxNQUFNLElBQUksTUFBTSxLQUFLLFdBQVcsR0FBRyxRQUFRO0VBQzNDLE1BQU0sTUFBTSxNQUFNLEtBQUssYUFBYSxHQUFHLFFBQVE7RUFDL0MsTUFBTSxJQUFJLE1BQU0sS0FBSyxhQUFhLEdBQUcsUUFBUTtFQUM3QyxNQUFNLElBQUksS0FBSyxjQUFjO0VBQzdCLE1BQU0sT0FBTztJQUFDO0lBQU87SUFBTztJQUFPO0lBQU87SUFBTztJQUFPO0dBQU07RUFDOUQsTUFBTSxTQUFTO0lBQ2I7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0dBQ0Q7RUFDRCxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssU0FBUyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUN0QyxNQUFNLENBQUMsS0FBSyxXQUFXLEdBQUcsQ0FDM0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDO0FBQzlCIn0=
// denoCacheMetadata=8336155754005360504,10306453216219699125