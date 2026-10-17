#!/usr/bin/env node
/**
 * make-zip.js — 生成 UTF-8 文件名的 ZIP（通用位标记 bit 11）。
 * Windows 的 Compress-Archive 会把中文名写成 GBK，Linux 主机解压后乱码；
 * 这里直接按 ZIP 规范写本地头/中央目录，文件名统一 UTF-8。
 *
 * 用法: node scripts/make-zip.js <源目录> <输出.zip>
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'site.zip');

// ---- CRC32 ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

// 已压缩格式直接 store，其余 deflate
const STORE_EXT = new Set([
  '.png',
  '.webp',
  '.avif',
  '.jpg',
  '.jpeg',
  '.gif',
  '.woff',
  '.woff2',
  '.zip',
  '.mp4',
  '.ico',
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// DOS 时间（固定值，保证可重复构建）
const DOS_TIME = 0x6000; // 12:00:00
const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 17;

const files = walk(SRC).sort();
const chunks = [];
const central = [];
let offset = 0;
let stored = 0;
let compressedTotal = 0;
let rawTotal = 0;

for (const file of files) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const nameBuf = Buffer.from(rel, 'utf8');
  const data = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  let method = 8;
  let payload;
  if (STORE_EXT.has(ext)) {
    method = 0;
    payload = data;
    stored++;
  } else {
    payload = zlib.deflateRawSync(data, { level: 9 });
    // 压不动就 store
    if (payload.length >= data.length) {
      method = 0;
      payload = data;
    }
  }
  const crc = crc32(data);
  rawTotal += data.length;
  compressedTotal += payload.length;

  // ---- 本地文件头 ----
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // UTF-8 flag
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(payload.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  chunks.push(local, nameBuf, payload);
  const localOffset = offset;
  offset += local.length + nameBuf.length + payload.length;

  // ---- 中央目录项 ----
  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4); // version made by
  cd.writeUInt16LE(20, 6); // version needed
  cd.writeUInt16LE(0x0800, 8); // UTF-8 flag
  cd.writeUInt16LE(method, 10);
  cd.writeUInt16LE(DOS_TIME, 12);
  cd.writeUInt16LE(DOS_DATE, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(payload.length, 20);
  cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(nameBuf.length, 28);
  cd.writeUInt16LE(0, 30); // extra
  cd.writeUInt16LE(0, 32); // comment
  cd.writeUInt16LE(0, 34); // disk
  cd.writeUInt16LE(0, 36); // internal attrs
  cd.writeUInt32LE(0, 38); // external attrs
  cd.writeUInt32LE(localOffset, 42);
  central.push(Buffer.concat([cd, nameBuf]));
}

const centralBuf = Buffer.concat(central);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(centralBuf.length, 12);
eocd.writeUInt32LE(offset, 16);
eocd.writeUInt16LE(0, 20);

fs.writeFileSync(OUT, Buffer.concat([...chunks, centralBuf, eocd]));

const mb = (v) => (v / 1048576).toFixed(1) + 'MB';
console.log('文件数:', files.length, '| store:', stored);
console.log('原始:', mb(rawTotal), '→ ZIP:', mb(fs.statSync(OUT).size));
console.log('输出:', OUT);
