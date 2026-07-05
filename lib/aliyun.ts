import { createHmac, randomUUID } from "crypto";

type QueryParams = Record<string, string>;

function encode(value: string) {
  return encodeURIComponent(value).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
}

export function signedAliyunUrl(action: string, version: string, accessKeyId: string, accessKeySecret: string, now = new Date()) {
  const params: QueryParams = {
    AccessKeyId: accessKeyId,
    Action: action,
    Format: "JSON",
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    Timestamp: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: version,
  };

  const query = Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
  const stringToSign = `GET&${encode("/")}&${encode(query)}`;
  const signature = createHmac("sha1", `${accessKeySecret}&`).update(stringToSign).digest("base64");

  return `https://business.aliyuncs.com/?${query}&Signature=${encode(signature)}`;
}

export async function queryAliyunAccountBalance() {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  if (!accessKeyId || !accessKeySecret) return null;

  const res = await fetch(signedAliyunUrl("QueryAccountBalance", "2017-12-14", accessKeyId, accessKeySecret), {
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.Success === false) {
    throw new Error(json?.Message || json?.Code || `${res.status} ${res.statusText}`);
  }

  return json?.Data as
    | {
        AvailableAmount?: string;
        AvailableCashAmount?: string;
        CreditAmount?: string;
        Currency?: string;
        QuotaLimit?: string;
      }
    | undefined;
}
