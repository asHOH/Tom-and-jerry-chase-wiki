const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync(require('path').resolve(__dirname, '..', '..', 'tjwiki-static.zip'));

// 找 EOCD
let eocd = -1;
for (let i = buf.length - 22; i >= 0; i--) {
  if (buf.readUInt32LE(i) === 0x06054b50) {
    eocd = i;
    break;
  }
}
if (eocd < 0) throw new Error('no EOCD');
const total = buf.readUInt16LE(eocd + 10);
const cdOffset = buf.readUInt32LE(eocd + 16);
console.log('条目数:', total, '| 中央目录偏移:', cdOffset);

// 遍历中央目录
let p = cdOffset;
const entries = [];
for (let i = 0; i < total; i++) {
  const sig = buf.readUInt32LE(p);
  if (sig !== 0x02014b50) throw new Error('bad cd sig at ' + p);
  const flags = buf.readUInt16LE(p + 8);
  const method = buf.readUInt16LE(p + 10);
  const crc = buf.readUInt32LE(p + 16);
  const csize = buf.readUInt32LE(p + 20);
  const usize = buf.readUInt32LE(p + 24);
  const nlen = buf.readUInt16LE(p + 28);
  const elen = buf.readUInt16LE(p + 30);
  const clen = buf.readUInt16LE(p + 32);
  const lho = buf.readUInt32LE(p + 42);
  const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8');
  entries.push({ name, flags, method, crc, csize, usize, lho });
  p += 46 + nlen + elen + clen;
}

const utf8Flagged = entries.filter((e) => (e.flags & 0x0800) !== 0).length;
console.log('UTF-8 标记条目:', utf8Flagged, '/', entries.length);
console.log(
  '含 .htaccess:',
  entries.some((e) => e.name === '.htaccess')
);
console.log('中文示例:');
entries
  .filter((e) => /characters\/.+index\.html$/.test(e.name))
  .slice(0, 3)
  .forEach((e) => console.log('  ' + e.name));
entries
  .filter((e) => e.name.startsWith('images/cats/') && e.name.endsWith('.avif'))
  .slice(0, 2)
  .forEach((e) => console.log('  ' + e.name));

// 抽查 3 个条目：解压 + CRC 校验
function verify(e) {
  const lh = e.lho;
  if (buf.readUInt32LE(lh) !== 0x04034b50) return 'bad local header';
  const nlen = buf.readUInt16LE(lh + 26);
  const elen = buf.readUInt16LE(lh + 28);
  const start = lh + 30 + nlen + elen;
  const raw = buf.slice(start, start + e.csize);
  const data = e.method === 0 ? raw : zlib.inflateRawSync(raw);
  if (data.length !== e.usize) return 'size mismatch';
  // crc32
  const T = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  let c = -1;
  for (let i = 0; i < data.length; i++) c = T[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  const got = (c ^ -1) >>> 0;
  return got === e.crc ? 'OK' : 'CRC mismatch';
}

const samples = [
  entries.find((e) => e.name === 'index.html'),
  entries.find((e) => /characters\/托普斯\/index\.html$/.test(e.name)),
  entries.find((e) => e.name.endsWith('.avif')),
  entries.find((e) => e.name === '.htaccess'),
];
console.log('\n抽查解压:');
for (const s of samples) console.log('  ' + s.name + ' -> ' + verify(s));
