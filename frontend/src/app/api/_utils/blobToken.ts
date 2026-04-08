export function getBlobReadWriteToken() {
  // Vercel Blob uses `BLOB_READ_WRITE_TOKEN`. Some setups may expose alternative names,
  // so we support a few common fallbacks to reduce configuration footguns.
  return (
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_TOKEN ||
    ''
  ).trim();
}

export function hasBlobReadWriteToken() {
  return Boolean(getBlobReadWriteToken());
}

