/**
 * Functions defined in the HTTP spec.
 */

import { parse as parseUrl, resolve as resolveUrl, Url } from 'url';

/**
 * Calculates the effective request URI from the host header and requested URL.
 * https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-4.2
 *
 * @param requestProtocol Protocol (with trailing colon).
 * @param requestUrl The URL requested (possibly absolute).
 * @param hostHeader The host header.
 */
export function effectiveRequestUrl(requestProtocol: string, requestUrl: string, hostHeader: string): Url {
  if (!requestProtocol.endsWith(':')) {
    throw new Error('Trailing colon required.');
  }
  if (requestUrl === '*') {
    requestUrl = '';
  }

  const url = parseUrl(requestUrl);
  if (url.host) {
    return url;
  }

  return parseUrl(resolveUrl(requestProtocol + '//' + hostHeader, requestUrl));
}
