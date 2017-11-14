import { OutgoingHttpHeaders, ServerResponse } from "http";

export interface IHeaderMap {
  [name: string]: string[]
};

/**
 * Parses raw headers losslessly.  Normalises header case to lowercase.
 *
 * @param rawHeaders Raw headers alternating list of names and values from the http module.
 */
export function parseRawHeaders(rawHeaders: string[]): IHeaderMap {
  const normalized: IHeaderMap = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const name = rawHeaders[i].toLowerCase();
    const value = rawHeaders[i + 1];
    const values = normalized[name] || [];
    values.push(value);
    if (values.length === 1) {
      normalized[name] = values;
    }
  }
  return normalized;
}
