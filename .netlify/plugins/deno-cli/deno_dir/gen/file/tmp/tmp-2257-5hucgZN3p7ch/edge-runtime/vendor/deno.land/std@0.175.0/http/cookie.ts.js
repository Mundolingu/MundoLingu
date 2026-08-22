// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Structured similarly to Go's cookie.go
// https://github.com/golang/go/blob/master/src/net/http/cookie.go
// This module is browser compatible.
import { assert } from "../_util/asserts.ts";
import { toIMF } from "../datetime/to_imf.ts";
const FIELD_CONTENT_REGEXP = /^(?=[\x20-\x7E]*$)[^()@<>,;:\\"\[\]?={}\s]+$/;
function toString(cookie) {
  if (!cookie.name) {
    return "";
  }
  const out = [];
  validateName(cookie.name);
  validateValue(cookie.name, cookie.value);
  out.push(`${cookie.name}=${cookie.value}`);
  // Fallback for invalid Set-Cookie
  // ref: https://tools.ietf.org/html/draft-ietf-httpbis-cookie-prefixes-00#section-3.1
  if (cookie.name.startsWith("__Secure")) {
    cookie.secure = true;
  }
  if (cookie.name.startsWith("__Host")) {
    cookie.path = "/";
    cookie.secure = true;
    delete cookie.domain;
  }
  if (cookie.secure) {
    out.push("Secure");
  }
  if (cookie.httpOnly) {
    out.push("HttpOnly");
  }
  if (typeof cookie.maxAge === "number" && Number.isInteger(cookie.maxAge)) {
    assert(cookie.maxAge >= 0, "Max-Age must be an integer superior or equal to 0");
    out.push(`Max-Age=${cookie.maxAge}`);
  }
  if (cookie.domain) {
    validateDomain(cookie.domain);
    out.push(`Domain=${cookie.domain}`);
  }
  if (cookie.sameSite) {
    out.push(`SameSite=${cookie.sameSite}`);
  }
  if (cookie.path) {
    validatePath(cookie.path);
    out.push(`Path=${cookie.path}`);
  }
  if (cookie.expires) {
    const { expires } = cookie;
    const dateString = toIMF(typeof expires === "number" ? new Date(expires) : expires);
    out.push(`Expires=${dateString}`);
  }
  if (cookie.unparsed) {
    out.push(cookie.unparsed.join("; "));
  }
  return out.join("; ");
}
/**
 * Validate Cookie Name.
 * @param name Cookie name.
 */ function validateName(name) {
  if (name && !FIELD_CONTENT_REGEXP.test(name)) {
    throw new TypeError(`Invalid cookie name: "${name}".`);
  }
}
/**
 * Validate Path Value.
 * See {@link https://tools.ietf.org/html/rfc6265#section-4.1.2.4}.
 * @param path Path value.
 */ function validatePath(path) {
  if (path == null) {
    return;
  }
  for(let i = 0; i < path.length; i++){
    const c = path.charAt(i);
    if (c < String.fromCharCode(0x20) || c > String.fromCharCode(0x7E) || c == ";") {
      throw new Error(path + ": Invalid cookie path char '" + c + "'");
    }
  }
}
/**
 * Validate Cookie Value.
 * See {@link https://tools.ietf.org/html/rfc6265#section-4.1}.
 * @param value Cookie value.
 */ function validateValue(name, value) {
  if (value == null || name == null) return;
  for(let i = 0; i < value.length; i++){
    const c = value.charAt(i);
    if (c < String.fromCharCode(0x21) || c == String.fromCharCode(0x22) || c == String.fromCharCode(0x2c) || c == String.fromCharCode(0x3b) || c == String.fromCharCode(0x5c) || c == String.fromCharCode(0x7f)) {
      throw new Error("RFC2616 cookie '" + name + "' cannot contain character '" + c + "'");
    }
    if (c > String.fromCharCode(0x80)) {
      throw new Error("RFC2616 cookie '" + name + "' can only have US-ASCII chars as value" + c.charCodeAt(0).toString(16));
    }
  }
}
/**
 * Validate Cookie Domain.
 * See {@link https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.2.3}.
 * @param domain Cookie domain.
 */ function validateDomain(domain) {
  if (domain == null) {
    return;
  }
  const char1 = domain.charAt(0);
  const charN = domain.charAt(domain.length - 1);
  if (char1 == "-" || charN == "." || charN == "-") {
    throw new Error("Invalid first/last char in cookie domain: " + domain);
  }
}
/**
 * Parse cookies of a header
 *
 * @example
 * ```ts
 * import { getCookies } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";
 *
 * const headers = new Headers();
 * headers.set("Cookie", "full=of; tasty=chocolate");
 *
 * const cookies = getCookies(headers);
 * console.log(cookies); // { full: "of", tasty: "chocolate" }
 * ```
 *
 * @param headers The headers instance to get cookies from
 * @return Object with cookie names as keys
 */ export function getCookies(headers) {
  const cookie = headers.get("Cookie");
  if (cookie != null) {
    const out = {};
    const c = cookie.split(";");
    for (const kv of c){
      const [cookieKey, ...cookieVal] = kv.split("=");
      assert(cookieKey != null);
      const key = cookieKey.trim();
      out[key] = cookieVal.join("=");
    }
    return out;
  }
  return {};
}
/**
 * Set the cookie header properly in the headers
 *
 * @example
 * ```ts
 * import {
 *   Cookie,
 *   setCookie,
 * } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";
 *
 * const headers = new Headers();
 * const cookie: Cookie = { name: "Space", value: "Cat" };
 * setCookie(headers, cookie);
 *
 * const cookieHeader = headers.get("set-cookie");
 * console.log(cookieHeader); // Space=Cat
 * ```
 *
 * @param headers The headers instance to set the cookie to
 * @param cookie Cookie to set
 */ export function setCookie(headers, cookie) {
  // Parsing cookie headers to make consistent set-cookie header
  // ref: https://tools.ietf.org/html/rfc6265#section-4.1.1
  const v = toString(cookie);
  if (v) {
    headers.append("Set-Cookie", v);
  }
}
/**
 * Set the cookie header with empty value in the headers to delete it
 *
 * > Note: Deleting a `Cookie` will set its expiration date before now. Forcing
 * > the browser to delete it.
 *
 * @example
 * ```ts
 * import { deleteCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";
 *
 * const headers = new Headers();
 * deleteCookie(headers, "deno");
 *
 * const cookieHeader = headers.get("set-cookie");
 * console.log(cookieHeader); // deno=; Expires=Thus, 01 Jan 1970 00:00:00 GMT
 * ```
 *
 * @param headers The headers instance to delete the cookie from
 * @param name Name of cookie
 * @param attributes Additional cookie attributes
 */ export function deleteCookie(headers, name, attributes) {
  setCookie(headers, {
    name: name,
    value: "",
    expires: new Date(0),
    ...attributes
  });
}
function parseSetCookie(value) {
  const attrs = value.split(";").map((attr)=>attr.trim().split("=").map((keyOrValue)=>keyOrValue.trim()));
  const cookie = {
    name: attrs[0][0],
    value: attrs[0][1]
  };
  for (const [key, value] of attrs.slice(1)){
    switch(key.toLocaleLowerCase()){
      case "expires":
        cookie.expires = new Date(value);
        break;
      case "max-age":
        cookie.maxAge = Number(value);
        if (cookie.maxAge < 0) {
          console.warn("Max-Age must be an integer superior or equal to 0. Cookie ignored.");
          return null;
        }
        break;
      case "domain":
        cookie.domain = value;
        break;
      case "path":
        cookie.path = value;
        break;
      case "secure":
        cookie.secure = true;
        break;
      case "httponly":
        cookie.httpOnly = true;
        break;
      case "samesite":
        cookie.sameSite = value;
        break;
      default:
        if (!Array.isArray(cookie.unparsed)) {
          cookie.unparsed = [];
        }
        cookie.unparsed.push([
          key,
          value
        ].join("="));
    }
  }
  if (cookie.name.startsWith("__Secure-")) {
    /** This requirement is mentioned in https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie but not the RFC. */ if (!cookie.secure) {
      console.warn("Cookies with names starting with `__Secure-` must be set with the secure flag. Cookie ignored.");
      return null;
    }
  }
  if (cookie.name.startsWith("__Host-")) {
    if (!cookie.secure) {
      console.warn("Cookies with names starting with `__Host-` must be set with the secure flag. Cookie ignored.");
      return null;
    }
    if (cookie.domain !== undefined) {
      console.warn("Cookies with names starting with `__Host-` must not have a domain specified. Cookie ignored.");
      return null;
    }
    if (cookie.path !== "/") {
      console.warn("Cookies with names starting with `__Host-` must have path be `/`. Cookie has been ignored.");
      return null;
    }
  }
  return cookie;
}
/**
 * Parse set-cookies of a header
 *
 * @example
 * ```ts
 * import { getSetCookies } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";
 *
 * const headers = new Headers([
 *   ["Set-Cookie", "lulu=meow; Secure; Max-Age=3600"],
 *   ["Set-Cookie", "booya=kasha; HttpOnly; Path=/"],
 * ]);
 *
 * const cookies = getSetCookies(headers);
 * console.log(cookies); // [{ name: "lulu", value: "meow", secure: true, maxAge: 3600 }, { name: "booya", value: "kahsa", httpOnly: true, path: "/ }]
 * ```
 *
 * @param headers The headers instance to get set-cookies from
 * @return List of cookies
 */ export function getSetCookies(headers) {
  if (!headers.has("set-cookie")) {
    return [];
  }
  return [
    ...headers.entries()
  ].filter(([key])=>key === "set-cookie").map(([_, value])=>value)/** Parse each `set-cookie` header separately */ .map(parseSetCookie)/** Skip empty cookies */ .filter(Boolean);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vdG1wL3RtcC0yMjU3LTVodWNnWk4zcDdjaC9lZGdlLXJ1bnRpbWUvdmVuZG9yL2Rlbm8ubGFuZC9zdGRAMC4xNzUuMC9odHRwL2Nvb2tpZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gU3RydWN0dXJlZCBzaW1pbGFybHkgdG8gR28ncyBjb29raWUuZ29cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvc3JjL25ldC9odHRwL2Nvb2tpZS5nb1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0cy50c1wiO1xuaW1wb3J0IHsgdG9JTUYgfSBmcm9tIFwiLi4vZGF0ZXRpbWUvdG9faW1mLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29va2llIHtcbiAgLyoqIE5hbWUgb2YgdGhlIGNvb2tpZS4gKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogVmFsdWUgb2YgdGhlIGNvb2tpZS4gKi9cbiAgdmFsdWU6IHN0cmluZztcbiAgLyoqIFRoZSBjb29raWUncyBgRXhwaXJlc2AgYXR0cmlidXRlLCBlaXRoZXIgYXMgYW4gZXhwbGljaXQgZGF0ZSBvciBVVEMgbWlsbGlzZWNvbmRzLlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5FeHBsaWNpdCBkYXRlOjwvY2FwdGlvbj5cbiAgICpcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQ29va2llIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9jb29raWUudHNcIjtcbiAgICogY29uc3QgY29va2llOiBDb29raWUgPSB7XG4gICAqICAgbmFtZTogJ25hbWUnLFxuICAgKiAgIHZhbHVlOiAndmFsdWUnLFxuICAgKiAgIC8vIGV4cGlyZXMgb24gRnJpIERlYyAzMCAyMDIyXG4gICAqICAgZXhwaXJlczogbmV3IERhdGUoJzIwMjItMTItMzEnKVxuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5VVEMgbWlsbGlzZWNvbmRzPC9jYXB0aW9uPlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBDb29raWUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2Nvb2tpZS50c1wiO1xuICAgKiBjb25zdCBjb29raWU6IENvb2tpZSA9IHtcbiAgICogICBuYW1lOiAnbmFtZScsXG4gICAqICAgdmFsdWU6ICd2YWx1ZScsXG4gICAqICAgLy8gZXhwaXJlcyAxMCBzZWNvbmRzIGZyb20gbm93XG4gICAqICAgZXhwaXJlczogRGF0ZS5ub3coKSArIDEwMDAwXG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBleHBpcmVzPzogRGF0ZSB8IG51bWJlcjtcbiAgLyoqIFRoZSBjb29raWUncyBgTWF4LUFnZWAgYXR0cmlidXRlLCBpbiBzZWNvbmRzLiBNdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIuIEEgY29va2llIHdpdGggYSBgbWF4QWdlYCBvZiBgMGAgZXhwaXJlcyBpbW1lZGlhdGVseS4gKi9cbiAgbWF4QWdlPzogbnVtYmVyO1xuICAvKiogVGhlIGNvb2tpZSdzIGBEb21haW5gIGF0dHJpYnV0ZS4gU3BlY2lmaWVzIHRob3NlIGhvc3RzIHRvIHdoaWNoIHRoZSBjb29raWUgd2lsbCBiZSBzZW50LiAqL1xuICBkb21haW4/OiBzdHJpbmc7XG4gIC8qKiBUaGUgY29va2llJ3MgYFBhdGhgIGF0dHJpYnV0ZS4gQSBjb29raWUgd2l0aCBhIHBhdGggd2lsbCBvbmx5IGJlIGluY2x1ZGVkIGluIHRoZSBgQ29va2llYCByZXF1ZXN0IGhlYWRlciBpZiB0aGUgcmVxdWVzdGVkIFVSTCBtYXRjaGVzIHRoYXQgcGF0aC4gKi9cbiAgcGF0aD86IHN0cmluZztcbiAgLyoqIFRoZSBjb29raWUncyBgU2VjdXJlYCBhdHRyaWJ1dGUuIElmIGB0cnVlYCwgdGhlIGNvb2tpZSB3aWxsIG9ubHkgYmUgaW5jbHVkZWQgaW4gdGhlIGBDb29raWVgIHJlcXVlc3QgaGVhZGVyIGlmIHRoZSBjb25uZWN0aW9uIHVzZXMgU1NMIGFuZCBIVFRQUy4gKi9cbiAgc2VjdXJlPzogYm9vbGVhbjtcbiAgLyoqIFRoZSBjb29raWUncyBgSFRUUE9ubHlgIGF0dHJpYnV0ZS4gSWYgYHRydWVgLCB0aGUgY29va2llIGNhbm5vdCBiZSBhY2Nlc3NlZCB2aWEgSmF2YVNjcmlwdC4gKi9cbiAgaHR0cE9ubHk/OiBib29sZWFuO1xuICAvKipcbiAgICogQWxsb3dzIHNlcnZlcnMgdG8gYXNzZXJ0IHRoYXQgYSBjb29raWUgb3VnaHQgbm90IHRvXG4gICAqIGJlIHNlbnQgYWxvbmcgd2l0aCBjcm9zcy1zaXRlIHJlcXVlc3RzLlxuICAgKi9cbiAgc2FtZVNpdGU/OiBcIlN0cmljdFwiIHwgXCJMYXhcIiB8IFwiTm9uZVwiO1xuICAvKiogQWRkaXRpb25hbCBrZXkgdmFsdWUgcGFpcnMgd2l0aCB0aGUgZm9ybSBcImtleT12YWx1ZVwiICovXG4gIHVucGFyc2VkPzogc3RyaW5nW107XG59XG5cbmNvbnN0IEZJRUxEX0NPTlRFTlRfUkVHRVhQID0gL14oPz1bXFx4MjAtXFx4N0VdKiQpW14oKUA8Piw7OlxcXFxcIlxcW1xcXT89e31cXHNdKyQvO1xuXG5mdW5jdGlvbiB0b1N0cmluZyhjb29raWU6IENvb2tpZSk6IHN0cmluZyB7XG4gIGlmICghY29va2llLm5hbWUpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIHZhbGlkYXRlTmFtZShjb29raWUubmFtZSk7XG4gIHZhbGlkYXRlVmFsdWUoY29va2llLm5hbWUsIGNvb2tpZS52YWx1ZSk7XG4gIG91dC5wdXNoKGAke2Nvb2tpZS5uYW1lfT0ke2Nvb2tpZS52YWx1ZX1gKTtcblxuICAvLyBGYWxsYmFjayBmb3IgaW52YWxpZCBTZXQtQ29va2llXG4gIC8vIHJlZjogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtaHR0cGJpcy1jb29raWUtcHJlZml4ZXMtMDAjc2VjdGlvbi0zLjFcbiAgaWYgKGNvb2tpZS5uYW1lLnN0YXJ0c1dpdGgoXCJfX1NlY3VyZVwiKSkge1xuICAgIGNvb2tpZS5zZWN1cmUgPSB0cnVlO1xuICB9XG4gIGlmIChjb29raWUubmFtZS5zdGFydHNXaXRoKFwiX19Ib3N0XCIpKSB7XG4gICAgY29va2llLnBhdGggPSBcIi9cIjtcbiAgICBjb29raWUuc2VjdXJlID0gdHJ1ZTtcbiAgICBkZWxldGUgY29va2llLmRvbWFpbjtcbiAgfVxuXG4gIGlmIChjb29raWUuc2VjdXJlKSB7XG4gICAgb3V0LnB1c2goXCJTZWN1cmVcIik7XG4gIH1cbiAgaWYgKGNvb2tpZS5odHRwT25seSkge1xuICAgIG91dC5wdXNoKFwiSHR0cE9ubHlcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiBjb29raWUubWF4QWdlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIoY29va2llLm1heEFnZSkpIHtcbiAgICBhc3NlcnQoXG4gICAgICBjb29raWUubWF4QWdlID49IDAsXG4gICAgICBcIk1heC1BZ2UgbXVzdCBiZSBhbiBpbnRlZ2VyIHN1cGVyaW9yIG9yIGVxdWFsIHRvIDBcIixcbiAgICApO1xuICAgIG91dC5wdXNoKGBNYXgtQWdlPSR7Y29va2llLm1heEFnZX1gKTtcbiAgfVxuICBpZiAoY29va2llLmRvbWFpbikge1xuICAgIHZhbGlkYXRlRG9tYWluKGNvb2tpZS5kb21haW4pO1xuICAgIG91dC5wdXNoKGBEb21haW49JHtjb29raWUuZG9tYWlufWApO1xuICB9XG4gIGlmIChjb29raWUuc2FtZVNpdGUpIHtcbiAgICBvdXQucHVzaChgU2FtZVNpdGU9JHtjb29raWUuc2FtZVNpdGV9YCk7XG4gIH1cbiAgaWYgKGNvb2tpZS5wYXRoKSB7XG4gICAgdmFsaWRhdGVQYXRoKGNvb2tpZS5wYXRoKTtcbiAgICBvdXQucHVzaChgUGF0aD0ke2Nvb2tpZS5wYXRofWApO1xuICB9XG4gIGlmIChjb29raWUuZXhwaXJlcykge1xuICAgIGNvbnN0IHsgZXhwaXJlcyB9ID0gY29va2llO1xuICAgIGNvbnN0IGRhdGVTdHJpbmcgPSB0b0lNRihcbiAgICAgIHR5cGVvZiBleHBpcmVzID09PSBcIm51bWJlclwiID8gbmV3IERhdGUoZXhwaXJlcykgOiBleHBpcmVzLFxuICAgICk7XG4gICAgb3V0LnB1c2goYEV4cGlyZXM9JHtkYXRlU3RyaW5nfWApO1xuICB9XG4gIGlmIChjb29raWUudW5wYXJzZWQpIHtcbiAgICBvdXQucHVzaChjb29raWUudW5wYXJzZWQuam9pbihcIjsgXCIpKTtcbiAgfVxuICByZXR1cm4gb3V0LmpvaW4oXCI7IFwiKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBDb29raWUgTmFtZS5cbiAqIEBwYXJhbSBuYW1lIENvb2tpZSBuYW1lLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZU5hbWUobmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCkge1xuICBpZiAobmFtZSAmJiAhRklFTERfQ09OVEVOVF9SRUdFWFAudGVzdChuYW1lKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgY29va2llIG5hbWU6IFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgUGF0aCBWYWx1ZS5cbiAqIFNlZSB7QGxpbmsgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzYyNjUjc2VjdGlvbi00LjEuMi40fS5cbiAqIEBwYXJhbSBwYXRoIFBhdGggdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aChwYXRoOiBzdHJpbmcgfCBudWxsKSB7XG4gIGlmIChwYXRoID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYyA9IHBhdGguY2hhckF0KGkpO1xuICAgIGlmIChcbiAgICAgIGMgPCBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4MjApIHx8IGMgPiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4N0UpIHx8IGMgPT0gXCI7XCJcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgcGF0aCArIFwiOiBJbnZhbGlkIGNvb2tpZSBwYXRoIGNoYXIgJ1wiICsgYyArIFwiJ1wiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBDb29raWUgVmFsdWUuXG4gKiBTZWUge0BsaW5rIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2MjY1I3NlY3Rpb24tNC4xfS5cbiAqIEBwYXJhbSB2YWx1ZSBDb29raWUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlVmFsdWUobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICBpZiAodmFsdWUgPT0gbnVsbCB8fCBuYW1lID09IG51bGwpIHJldHVybjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGMgPSB2YWx1ZS5jaGFyQXQoaSk7XG4gICAgaWYgKFxuICAgICAgYyA8IFN0cmluZy5mcm9tQ2hhckNvZGUoMHgyMSkgfHwgYyA9PSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4MjIpIHx8XG4gICAgICBjID09IFN0cmluZy5mcm9tQ2hhckNvZGUoMHgyYykgfHwgYyA9PSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4M2IpIHx8XG4gICAgICBjID09IFN0cmluZy5mcm9tQ2hhckNvZGUoMHg1YykgfHwgYyA9PSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4N2YpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiUkZDMjYxNiBjb29raWUgJ1wiICsgbmFtZSArIFwiJyBjYW5ub3QgY29udGFpbiBjaGFyYWN0ZXIgJ1wiICsgYyArIFwiJ1wiLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGMgPiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4ODApKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiUkZDMjYxNiBjb29raWUgJ1wiICsgbmFtZSArIFwiJyBjYW4gb25seSBoYXZlIFVTLUFTQ0lJIGNoYXJzIGFzIHZhbHVlXCIgK1xuICAgICAgICAgIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNiksXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIENvb2tpZSBEb21haW4uXG4gKiBTZWUge0BsaW5rIGh0dHBzOi8vZGF0YXRyYWNrZXIuaWV0Zi5vcmcvZG9jL2h0bWwvcmZjNjI2NSNzZWN0aW9uLTQuMS4yLjN9LlxuICogQHBhcmFtIGRvbWFpbiBDb29raWUgZG9tYWluLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZURvbWFpbihkb21haW46IHN0cmluZykge1xuICBpZiAoZG9tYWluID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY2hhcjEgPSBkb21haW4uY2hhckF0KDApO1xuICBjb25zdCBjaGFyTiA9IGRvbWFpbi5jaGFyQXQoZG9tYWluLmxlbmd0aCAtIDEpO1xuICBpZiAoY2hhcjEgPT0gXCItXCIgfHwgY2hhck4gPT0gXCIuXCIgfHwgY2hhck4gPT0gXCItXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIkludmFsaWQgZmlyc3QvbGFzdCBjaGFyIGluIGNvb2tpZSBkb21haW46IFwiICsgZG9tYWluLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBjb29raWVzIG9mIGEgaGVhZGVyXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBnZXRDb29raWVzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9jb29raWUudHNcIjtcbiAqXG4gKiBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAqIGhlYWRlcnMuc2V0KFwiQ29va2llXCIsIFwiZnVsbD1vZjsgdGFzdHk9Y2hvY29sYXRlXCIpO1xuICpcbiAqIGNvbnN0IGNvb2tpZXMgPSBnZXRDb29raWVzKGhlYWRlcnMpO1xuICogY29uc29sZS5sb2coY29va2llcyk7IC8vIHsgZnVsbDogXCJvZlwiLCB0YXN0eTogXCJjaG9jb2xhdGVcIiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gaGVhZGVycyBUaGUgaGVhZGVycyBpbnN0YW5jZSB0byBnZXQgY29va2llcyBmcm9tXG4gKiBAcmV0dXJuIE9iamVjdCB3aXRoIGNvb2tpZSBuYW1lcyBhcyBrZXlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb29raWVzKGhlYWRlcnM6IEhlYWRlcnMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgY29va2llID0gaGVhZGVycy5nZXQoXCJDb29raWVcIik7XG4gIGlmIChjb29raWUgIT0gbnVsbCkge1xuICAgIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGNvbnN0IGMgPSBjb29raWUuc3BsaXQoXCI7XCIpO1xuICAgIGZvciAoY29uc3Qga3Ygb2YgYykge1xuICAgICAgY29uc3QgW2Nvb2tpZUtleSwgLi4uY29va2llVmFsXSA9IGt2LnNwbGl0KFwiPVwiKTtcbiAgICAgIGFzc2VydChjb29raWVLZXkgIT0gbnVsbCk7XG4gICAgICBjb25zdCBrZXkgPSBjb29raWVLZXkudHJpbSgpO1xuICAgICAgb3V0W2tleV0gPSBjb29raWVWYWwuam9pbihcIj1cIik7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgcmV0dXJuIHt9O1xufVxuXG4vKipcbiAqIFNldCB0aGUgY29va2llIGhlYWRlciBwcm9wZXJseSBpbiB0aGUgaGVhZGVyc1xuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHtcbiAqICAgQ29va2llLFxuICogICBzZXRDb29raWUsXG4gKiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0dHAvY29va2llLnRzXCI7XG4gKlxuICogY29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG4gKiBjb25zdCBjb29raWU6IENvb2tpZSA9IHsgbmFtZTogXCJTcGFjZVwiLCB2YWx1ZTogXCJDYXRcIiB9O1xuICogc2V0Q29va2llKGhlYWRlcnMsIGNvb2tpZSk7XG4gKlxuICogY29uc3QgY29va2llSGVhZGVyID0gaGVhZGVycy5nZXQoXCJzZXQtY29va2llXCIpO1xuICogY29uc29sZS5sb2coY29va2llSGVhZGVyKTsgLy8gU3BhY2U9Q2F0XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gaGVhZGVycyBUaGUgaGVhZGVycyBpbnN0YW5jZSB0byBzZXQgdGhlIGNvb2tpZSB0b1xuICogQHBhcmFtIGNvb2tpZSBDb29raWUgdG8gc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb29raWUoaGVhZGVyczogSGVhZGVycywgY29va2llOiBDb29raWUpIHtcbiAgLy8gUGFyc2luZyBjb29raWUgaGVhZGVycyB0byBtYWtlIGNvbnNpc3RlbnQgc2V0LWNvb2tpZSBoZWFkZXJcbiAgLy8gcmVmOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjI2NSNzZWN0aW9uLTQuMS4xXG4gIGNvbnN0IHYgPSB0b1N0cmluZyhjb29raWUpO1xuICBpZiAodikge1xuICAgIGhlYWRlcnMuYXBwZW5kKFwiU2V0LUNvb2tpZVwiLCB2KTtcbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgY29va2llIGhlYWRlciB3aXRoIGVtcHR5IHZhbHVlIGluIHRoZSBoZWFkZXJzIHRvIGRlbGV0ZSBpdFxuICpcbiAqID4gTm90ZTogRGVsZXRpbmcgYSBgQ29va2llYCB3aWxsIHNldCBpdHMgZXhwaXJhdGlvbiBkYXRlIGJlZm9yZSBub3cuIEZvcmNpbmdcbiAqID4gdGhlIGJyb3dzZXIgdG8gZGVsZXRlIGl0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGVsZXRlQ29va2llIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9jb29raWUudHNcIjtcbiAqXG4gKiBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAqIGRlbGV0ZUNvb2tpZShoZWFkZXJzLCBcImRlbm9cIik7XG4gKlxuICogY29uc3QgY29va2llSGVhZGVyID0gaGVhZGVycy5nZXQoXCJzZXQtY29va2llXCIpO1xuICogY29uc29sZS5sb2coY29va2llSGVhZGVyKTsgLy8gZGVubz07IEV4cGlyZXM9VGh1cywgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gaGVhZGVycyBUaGUgaGVhZGVycyBpbnN0YW5jZSB0byBkZWxldGUgdGhlIGNvb2tpZSBmcm9tXG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIGNvb2tpZVxuICogQHBhcmFtIGF0dHJpYnV0ZXMgQWRkaXRpb25hbCBjb29raWUgYXR0cmlidXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlQ29va2llKFxuICBoZWFkZXJzOiBIZWFkZXJzLFxuICBuYW1lOiBzdHJpbmcsXG4gIGF0dHJpYnV0ZXM/OiB7IHBhdGg/OiBzdHJpbmc7IGRvbWFpbj86IHN0cmluZyB9LFxuKSB7XG4gIHNldENvb2tpZShoZWFkZXJzLCB7XG4gICAgbmFtZTogbmFtZSxcbiAgICB2YWx1ZTogXCJcIixcbiAgICBleHBpcmVzOiBuZXcgRGF0ZSgwKSxcbiAgICAuLi5hdHRyaWJ1dGVzLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gcGFyc2VTZXRDb29raWUodmFsdWU6IHN0cmluZyk6IENvb2tpZSB8IG51bGwge1xuICBjb25zdCBhdHRycyA9IHZhbHVlXG4gICAgLnNwbGl0KFwiO1wiKVxuICAgIC5tYXAoKGF0dHIpID0+XG4gICAgICBhdHRyXG4gICAgICAgIC50cmltKClcbiAgICAgICAgLnNwbGl0KFwiPVwiKVxuICAgICAgICAubWFwKChrZXlPclZhbHVlKSA9PiBrZXlPclZhbHVlLnRyaW0oKSlcbiAgICApO1xuICBjb25zdCBjb29raWU6IENvb2tpZSA9IHtcbiAgICBuYW1lOiBhdHRyc1swXVswXSxcbiAgICB2YWx1ZTogYXR0cnNbMF1bMV0sXG4gIH07XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgYXR0cnMuc2xpY2UoMSkpIHtcbiAgICBzd2l0Y2ggKGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlIFwiZXhwaXJlc1wiOlxuICAgICAgICBjb29raWUuZXhwaXJlcyA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibWF4LWFnZVwiOlxuICAgICAgICBjb29raWUubWF4QWdlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgaWYgKGNvb2tpZS5tYXhBZ2UgPCAwKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgXCJNYXgtQWdlIG11c3QgYmUgYW4gaW50ZWdlciBzdXBlcmlvciBvciBlcXVhbCB0byAwLiBDb29raWUgaWdub3JlZC5cIixcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRvbWFpblwiOlxuICAgICAgICBjb29raWUuZG9tYWluID0gdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInBhdGhcIjpcbiAgICAgICAgY29va2llLnBhdGggPSB2YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2VjdXJlXCI6XG4gICAgICAgIGNvb2tpZS5zZWN1cmUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJodHRwb25seVwiOlxuICAgICAgICBjb29raWUuaHR0cE9ubHkgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzYW1lc2l0ZVwiOlxuICAgICAgICBjb29raWUuc2FtZVNpdGUgPSB2YWx1ZSBhcyBDb29raWVbXCJzYW1lU2l0ZVwiXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29va2llLnVucGFyc2VkKSkge1xuICAgICAgICAgIGNvb2tpZS51bnBhcnNlZCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGNvb2tpZS51bnBhcnNlZC5wdXNoKFtrZXksIHZhbHVlXS5qb2luKFwiPVwiKSk7XG4gICAgfVxuICB9XG4gIGlmIChjb29raWUubmFtZS5zdGFydHNXaXRoKFwiX19TZWN1cmUtXCIpKSB7XG4gICAgLyoqIFRoaXMgcmVxdWlyZW1lbnQgaXMgbWVudGlvbmVkIGluIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvSGVhZGVycy9TZXQtQ29va2llIGJ1dCBub3QgdGhlIFJGQy4gKi9cbiAgICBpZiAoIWNvb2tpZS5zZWN1cmUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJDb29raWVzIHdpdGggbmFtZXMgc3RhcnRpbmcgd2l0aCBgX19TZWN1cmUtYCBtdXN0IGJlIHNldCB3aXRoIHRoZSBzZWN1cmUgZmxhZy4gQ29va2llIGlnbm9yZWQuXCIsXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGlmIChjb29raWUubmFtZS5zdGFydHNXaXRoKFwiX19Ib3N0LVwiKSkge1xuICAgIGlmICghY29va2llLnNlY3VyZSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIkNvb2tpZXMgd2l0aCBuYW1lcyBzdGFydGluZyB3aXRoIGBfX0hvc3QtYCBtdXN0IGJlIHNldCB3aXRoIHRoZSBzZWN1cmUgZmxhZy4gQ29va2llIGlnbm9yZWQuXCIsXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChjb29raWUuZG9tYWluICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJDb29raWVzIHdpdGggbmFtZXMgc3RhcnRpbmcgd2l0aCBgX19Ib3N0LWAgbXVzdCBub3QgaGF2ZSBhIGRvbWFpbiBzcGVjaWZpZWQuIENvb2tpZSBpZ25vcmVkLlwiLFxuICAgICAgKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoY29va2llLnBhdGggIT09IFwiL1wiKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiQ29va2llcyB3aXRoIG5hbWVzIHN0YXJ0aW5nIHdpdGggYF9fSG9zdC1gIG11c3QgaGF2ZSBwYXRoIGJlIGAvYC4gQ29va2llIGhhcyBiZWVuIGlnbm9yZWQuXCIsXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb29raWU7XG59XG5cbi8qKlxuICogUGFyc2Ugc2V0LWNvb2tpZXMgb2YgYSBoZWFkZXJcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGdldFNldENvb2tpZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2Nvb2tpZS50c1wiO1xuICpcbiAqIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhbXG4gKiAgIFtcIlNldC1Db29raWVcIiwgXCJsdWx1PW1lb3c7IFNlY3VyZTsgTWF4LUFnZT0zNjAwXCJdLFxuICogICBbXCJTZXQtQ29va2llXCIsIFwiYm9veWE9a2FzaGE7IEh0dHBPbmx5OyBQYXRoPS9cIl0sXG4gKiBdKTtcbiAqXG4gKiBjb25zdCBjb29raWVzID0gZ2V0U2V0Q29va2llcyhoZWFkZXJzKTtcbiAqIGNvbnNvbGUubG9nKGNvb2tpZXMpOyAvLyBbeyBuYW1lOiBcImx1bHVcIiwgdmFsdWU6IFwibWVvd1wiLCBzZWN1cmU6IHRydWUsIG1heEFnZTogMzYwMCB9LCB7IG5hbWU6IFwiYm9veWFcIiwgdmFsdWU6IFwia2Foc2FcIiwgaHR0cE9ubHk6IHRydWUsIHBhdGg6IFwiLyB9XVxuICogYGBgXG4gKlxuICogQHBhcmFtIGhlYWRlcnMgVGhlIGhlYWRlcnMgaW5zdGFuY2UgdG8gZ2V0IHNldC1jb29raWVzIGZyb21cbiAqIEByZXR1cm4gTGlzdCBvZiBjb29raWVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXRDb29raWVzKGhlYWRlcnM6IEhlYWRlcnMpOiBDb29raWVbXSB7XG4gIGlmICghaGVhZGVycy5oYXMoXCJzZXQtY29va2llXCIpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBbLi4uaGVhZGVycy5lbnRyaWVzKCldXG4gICAgLmZpbHRlcigoW2tleV0pID0+IGtleSA9PT0gXCJzZXQtY29va2llXCIpXG4gICAgLm1hcCgoW18sIHZhbHVlXSkgPT4gdmFsdWUpXG4gICAgLyoqIFBhcnNlIGVhY2ggYHNldC1jb29raWVgIGhlYWRlciBzZXBhcmF0ZWx5ICovXG4gICAgLm1hcChwYXJzZVNldENvb2tpZSlcbiAgICAvKiogU2tpcCBlbXB0eSBjb29raWVzICovXG4gICAgLmZpbHRlcihCb29sZWFuKSBhcyBDb29raWVbXTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUseUNBQXlDO0FBQ3pDLGtFQUFrRTtBQUNsRSxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsc0JBQXNCO0FBQzdDLFNBQVMsS0FBSyxRQUFRLHdCQUF3QjtBQW9EOUMsTUFBTSx1QkFBdUI7QUFFN0IsU0FBUyxTQUFTLE1BQWM7RUFDOUIsSUFBSSxDQUFDLE9BQU8sSUFBSSxFQUFFO0lBQ2hCLE9BQU87RUFDVDtFQUNBLE1BQU0sTUFBZ0IsRUFBRTtFQUN4QixhQUFhLE9BQU8sSUFBSTtFQUN4QixjQUFjLE9BQU8sSUFBSSxFQUFFLE9BQU8sS0FBSztFQUN2QyxJQUFJLElBQUksQ0FBQyxHQUFHLE9BQU8sSUFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLEtBQUss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
// denoCacheMetadata=5746708962089520185,14967428506325077510