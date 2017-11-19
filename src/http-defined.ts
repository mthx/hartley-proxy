/**
 * Functions defined in the HTTP spec.
 */

import * as url from 'url';

/**
 * Calculates the effective request URI from the host header and requested URL.
 * https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-4.2
 *
 * @param requestProtocol Protocol (with trailing colon).
 * @param requestUrl The URL requested (possibly absolute).
 * @param hostHeader The host header.
 */
export function effectiveRequestUrl(
  requestProtocol: string,
  requestUrl: string,
  hostHeader: string
): url.Url {
  if (!requestProtocol.endsWith(':')) {
    throw new Error('Trailing colon required.');
  }
  if (requestUrl === '*') {
    requestUrl = '';
  }

  const parsed = url.parse(requestUrl);
  if (parsed.host) {
    return parsed;
  }

  return url.parse(
    url.resolve(requestProtocol + '//' + hostHeader, requestUrl)
  );
}
