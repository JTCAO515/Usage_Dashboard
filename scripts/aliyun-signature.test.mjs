import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

function encode(value) {
  return encodeURIComponent(value).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
}

test("Aliyun RPC signatures sort and encode query params", () => {
  const params = {
    Version: "2017-12-14",
    Action: "QueryAccountBalance",
    AccessKeyId: "test id",
    Timestamp: "2026-07-05T09:00:00Z",
    SignatureNonce: "nonce",
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    Format: "JSON",
  };
  const query = Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
  const stringToSign = `GET&${encode("/")}&${encode(query)}`;
  const signature = createHmac("sha1", "secret&").update(stringToSign).digest("base64");

  assert.equal(query.startsWith("AccessKeyId=test%20id&Action=QueryAccountBalance"), true);
  assert.equal(stringToSign.includes("Timestamp%3D2026-07-05T09%253A00%253A00Z"), true);
  assert.equal(signature, "3rxCsHhCm3otd+PYOlgof+opeZo=");
});
