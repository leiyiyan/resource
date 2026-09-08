/*
new Env('PingMe');
@Name: PingMe 自动化签到 + 视频奖励（通用版）
@Author: 怎么肥事（原始 Quantumult X 版）/ 通用化改写
@Date: 2026-09-07

@Description:
PingMe 每日签到 + 看视频领金币，支持多账号。
存储键沿用原版 pingme_accounts_v1，Quantumult X 老用户可无缝迁移。


====================================
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制此脚本，即视为您已接受此免责声明。
 */

// env.js 全局
const $ = new Env("PingMe");
const ckName = "pingme_accounts_v1";
var userCookie = ($.isNode() ? JSON.parse(process.env[ckName]) : $.getdata(ckName)) || '';
//-------------------- 一般不动变量区域 -------------------------------------
const Notify = 1; //0为关闭通知,1为打开通知,默认为1
let notify = '';
if ($.isNode()) { try { notify = require('./sendNotify'); } catch (e) { } }
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
// 调试
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
// 为通知准备的空数组
$.notifyMsg = [];

//---------------------- 自定义变量区域 -----------------------------------
// 读取配置（Node 走环境变量，其余平台走持久化存储，取不到用默认值）
function envVal(key, def) {
  const raw = $.isNode() ? process.env[key] : $.getdata(key);
  if (raw === undefined || raw === null || raw === '') return def;
  const n = parseInt(raw, 10);
  return isNaN(n) ? def : n;
}
const MAX_VIDEO = envVal('PINGME_MAX_VIDEO', 5);
const VIDEO_DELAY = envVal('PINGME_VIDEO_DELAY', 8000);
const ACCOUNT_GAP = envVal('PINGME_ACCOUNT_GAP', 3500);

const IOS_VERSIONS = ['17.5.1', '17.6.1', '17.4.1', '17.2.1', '16.7.8', '17.6', '17.3.1', '18.0.1', '17.1.2', '16.6.1'];
const IOS_SCALES = ['2.00', '3.00', '3.00', '2.00', '3.00'];
const IPHONE_MODELS = ['iPhone14,3', 'iPhone13,3', 'iPhone15,3', 'iPhone16,1', 'iPhone14,7', 'iPhone13,2', 'iPhone15,2', 'iPhone12,1'];
const CFN_VERS = ['1410.0.3', '1494.0.7', '1568.100.1', '1209.1', '1474.0.4', '1568.200.2'];
const DARWIN_VERS = ['22.6.0', '23.5.0', '23.6.0', '24.0.0', '22.4.0'];

//-------------------------- 工具函数区域 -----------------------------------
function MD5(string) {
  function RotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)); }
  function AddUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000, lY4 = lY & 0x40000000, lX8 = lX & 0x80000000, lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) return (lResult & 0x40000000) ? (lResult ^ 0xC0000000 ^ lX8 ^ lY8) : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | (~z)); }
  function FF(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function GG(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function HH(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function II(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); }
  function ConvertToWordArray(str) {
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0, lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] |= str.charCodeAt(lByteCount) << lBytePosition;
      lByteCount++;
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] |= 0x80 << lBytePosition;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue) {
    let WordToHexValue = '';
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue += WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  const x = ConvertToWordArray(string);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22, S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23, S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756); c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A); c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF); c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193); c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340); c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x02441453); c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6); c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8); c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681); c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9); c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA); c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5); c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97); c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92); c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0); c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235); c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = AddUnsigned(a, AA); b = AddUnsigned(b, BB); c = AddUnsigned(c, CC); d = AddUnsigned(d, DD);
  }
  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase();
}

function getUTCSignDate() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function parseRawQuery(url) {
  const query = String(url || '').split('?')[1] || '';
  const rawMap = {};
  query.split('#')[0].split('&').forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    rawMap[pair.slice(0, idx)] = pair.slice(idx + 1);
  });
  return rawMap;
}

function fingerprintOf(paramsRaw) {
  const drop = { sign: 1, signDate: 1, timestamp: 1, ts: 1, nonce: 1, random: 1, reqTime: 1, reqId: 1, requestId: 1 };
  const base = Object.keys(paramsRaw || {}).filter(k => !drop[k]).sort().map(k => `${k}=${paramsRaw[k]}`).join('&');
  return MD5(base).slice(0, 12);
}

function pickItem(arr, seed) { return arr[Math.abs(seed) % arr.length]; }

function buildUA(baseUA, seed) {
  const iosVer = pickItem(IOS_VERSIONS, seed);
  const scale = pickItem(IOS_SCALES, seed + 1);
  const model = pickItem(IPHONE_MODELS, seed + 2);
  const cfn = pickItem(CFN_VERS, seed + 3);
  const darwin = pickItem(DARWIN_VERS, seed + 4);
  if (baseUA && typeof baseUA === 'string') {
    let ua = baseUA;
    let changed = false;
    if (/iOS \d+(\.\d+){0,2}/.test(ua)) { ua = ua.replace(/iOS \d+(\.\d+){0,2}/, `iOS ${iosVer}`); changed = true; }
    if (/Scale\/\d+(\.\d+)?/.test(ua)) { ua = ua.replace(/Scale\/\d+(\.\d+)?/, `Scale/${scale}`); changed = true; }
    if (/iPhone\d+,\d+/.test(ua)) { ua = ua.replace(/iPhone\d+,\d+/, model); changed = true; }
    if (/CFNetwork\/[\d.]+/.test(ua)) { ua = ua.replace(/CFNetwork\/[\d.]+/, `CFNetwork/${cfn}`); changed = true; }
    if (/Darwin\/[\d.]+/.test(ua)) { ua = ua.replace(/Darwin\/[\d.]+/, `Darwin/${darwin}`); changed = true; }
    if (changed) return ua;
  }
  return `PingMe/1.0.0 (${model}; iOS ${iosVer}; Scale/${scale}) CFNetwork/${cfn} Darwin/${darwin}`;
}

function buildSignedParamsRaw(capture, overrideDeviceId) {
  const params = {};
  Object.keys((capture && capture.paramsRaw) || {}).forEach(k => {
    if (k !== 'sign' && k !== 'signDate') params[k] = capture.paramsRaw[k];
  });
  if (overrideDeviceId && params.uniquedeviceid) params.uniquedeviceid = overrideDeviceId;
  params.signDate = getUTCSignDate();
  const signBase = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  params.sign = MD5(signBase + SECRET);
  return params;
}

function buildUrl(path, capture, overrideDeviceId) {
  const params = buildSignedParamsRaw(capture, overrideDeviceId);
  const qs = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  return `https://api.pingmeapp.net/app/${path}?${qs}`;
}

function randHex(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s.toUpperCase();
}

function genFakeDeviceId() {
  return `${randHex(8)}-${randHex(4)}-${randHex(4)}-${randHex(4)}-${randHex(12)}PingMeIOS`;
}

function buildHeaders(capture, ua) {
  const headers = {};
  Object.keys((capture && capture.headers) || {}).forEach(k => { headers[k] = capture.headers[k]; });
  // 干掉伪首部、长度类与连接类字段，避免各平台 HTTP 客户端报错
  ['Content-Length', 'content-length', 'Content-Type', 'content-type',
    ':authority', ':method', ':path', ':scheme',
    'Host', 'host', 'User-Agent', 'user-agent',
    'Connection', 'connection', 'Proxy-Connection', 'proxy-connection', 'Keep-Alive', 'keep-alive'
  ].forEach(k => { delete headers[k]; });
  headers['Host'] = 'api.pingmeapp.net';
  headers['Accept'] = 'application/json';
  headers['User-Agent'] = ua;
  if ($.isQuanX()) headers['Connection'] = 'close';
  return headers;
}

function getEmail(acc) {
  if (acc && acc.email) return acc.email;
  const raw = acc && acc.capture && acc.capture.paramsRaw ? (acc.capture.paramsRaw.email || '') : '';
  try { return decodeURIComponent(raw); } catch (e) { return raw; }
}

function isDeregistered(msg) {
  return typeof msg === 'string' && msg.indexOf('已被注销') !== -1;
}

//-------------------------- 存储区域 -----------------------------------
function loadStore() {
  let obj = null;
  const raw = $.getdata(ckName);
  
  if (raw) { try { obj = JSON.parse(raw); } catch (e) { obj = null; } }
  if (!obj || typeof obj !== 'object') obj = { version: 1, accounts: {}, order: [] };
  if (!obj.accounts || typeof obj.accounts !== 'object') obj.accounts = {};
  if (!Array.isArray(obj.order)) obj.order = Object.keys(obj.accounts);
  // Node 环境：允许用环境变量补充账号
  if ($.isNode() && process.env[ckName]) {
    let list = $.toObj(process.env[ckName]);
    if (list && !Array.isArray(list) && list.accounts) list = Object.keys(list.accounts).map(k => list.accounts[k]);
    if (Array.isArray(list)) {
      const base = obj.order.length;
      list.forEach((item, i) => {
        const acc = normalizeAccount(item, base + i);
        if (!acc) return;
        if (!obj.accounts[acc.id]) obj.order.push(acc.id);
        obj.accounts[acc.id] = Object.assign(obj.accounts[acc.id] || {}, acc, { updatedAt: Date.now() });
      });
    }
  }
  return obj;
}

function saveStore(store) {
  $.setdata($.toStr(store), ckName);
}

// 把环境变量里的各种写法统一成账号对象
function normalizeAccount(item, seq) {
  if (!item) return null;
  let data = item;
  if (typeof item === 'string') {
    const parsed = $.toObj(item);
    data = parsed || item;
  }
  if (typeof data === 'string') {
    if (data.indexOf('?') === -1) return null;
    return accountFromUrl(data, `账号${seq + 1}`);
  }
  // 直接给完整 URL 的对象
  if (typeof data.url === 'string' && data.url.indexOf('?') !== -1 && !data.paramsRaw) {
    return accountFromUrl(data.url, data.alias || `账号${seq + 1}`);
  }
  if (data.capture && (data.capture.paramsRaw || data.capture.url)) {
    const cap = data.capture;
    const paramsRaw = cap.paramsRaw || parseRawQuery(cap.url);
    const fp = fingerprintOf(paramsRaw);
    return {
      id: data.id || fp,
      alias: data.alias || `账号${seq + 1}`,
      email: data.email || decodeSafe(paramsRaw.email),
      uaSeed: data.uaSeed || seq,
      baseUA: data.baseUA || pickUAFromHeaders(cap.headers),
      capture: { url: cap.url || '', paramsRaw, headers: cap.headers || {} },
      createdAt: Date.now(), updatedAt: Date.now()
    };
  }
  // 直接给参数对象
  const fp = fingerprintOf(data);
  return {
    id: data.id || fp,
    alias: data.alias || `账号${seq + 1}`,
    email: data.email || decodeSafe(data.email),
    uaSeed: data.uaSeed || seq,
    baseUA: data.baseUA || '',
    capture: { url: '', paramsRaw: Object.assign({}, data), headers: {} },
    createdAt: Date.now(), updatedAt: Date.now()
  };
}

function decodeSafe(v) {
  try { return decodeURIComponent(v || ''); } catch (e) { return v || ''; }
}

function pickUAFromHeaders(headers) {
  let ua = '';
  Object.keys(headers || {}).forEach(k => { if (k.toLowerCase() === 'user-agent') ua = headers[k]; });
  return ua;
}

function accountFromUrl(url, alias) {
  const paramsRaw = parseRawQuery(url);
  return {
    id: fingerprintOf(paramsRaw),
    alias,
    email: decodeSafe(paramsRaw.email),
    uaSeed: 0,
    baseUA: '',
    capture: { url, paramsRaw, headers: {} },
    createdAt: Date.now(), updatedAt: Date.now()
  };
}

function removeAccounts(store, ids) {
  const removed = [];
  ids.forEach(id => {
    if (store.accounts[id]) {
      const em = getEmail(store.accounts[id]);
      removed.push((store.accounts[id].alias || id) + (em ? `(${em})` : ''));
      delete store.accounts[id];
    }
    const pos = store.order.indexOf(id);
    if (pos !== -1) store.order.splice(pos, 1);
  });
  return removed;
}

//-------------------------- 请求封装 -----------------------------------
// 统一走 Env 的 $.http.get，返回值标准化为 { status, body }
async function Request(o) {
  if (typeof o === 'string') o = { url: o };
  if (!o || !o.url) throw new Error('[发送请求] 缺少 url 参数');
  const timeout = o.timeout ? ($.isSurge() || $.isLoon() ? o.timeout / 1e3 : o.timeout) : 1.5e4;
  const opts = { url: o.url, headers: o.headers || {}, timeout };
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; reject(new Error('当前请求已超时')); } }, timeout + 500);
    $.http.get(opts)
      .then(resp => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve({ status: (resp && (resp.statusCode || resp.status)) || 0, body: resp ? resp.body : '' });
      })
      .catch(err => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        reject(err && (err.error || err.message || err) || '请求失败');
      });
  });
}

//-------------------------- 账号类 -----------------------------------
class PingMeAccount {
  constructor(acc, index, total) {
    this.index = index;
    this.total = total;
    this.id = acc.id;
    this.alias = acc.alias || acc.id;
    this.email = getEmail(acc);
    this.capture = acc.capture || { paramsRaw: {}, headers: {} };
    this.uaSeed = acc.uaSeed || 0;
    this.baseUA = acc.baseUA || '';
    this.ua = buildUA(this.baseUA, this.uaSeed);
    this.headers = buildHeaders(this.capture, this.ua);
    this.fakeDeviceId = genFakeDeviceId();
    this.msgs = [];
    this.deregistered = false;
    this.balance = null;
  }
  get tag() { return `[账号${this.index + 1}/${this.total} ${this.alias}]`; }
  log(t) { this.msgs.push(t); $.log(t); }
  // 带重试的接口请求，返回已解析的 JSON（解析失败返回 null）
  async fetchApi(path, useFakeId) {
    const url = buildUrl(path, this.capture, useFakeId ? this.fakeDeviceId : null);
    let lastErr = null;
    for (let i = 1; i <= 3; i++) {
      try {
        const res = await Request({ url, headers: this.headers, timeout: 1.5e4 });
        const data = $.toObj(res.body);
        if (!data) throw new Error('响应解析失败');
        debug(data, path);
        return data;
      } catch (e) {
        lastErr = e;
        const m = String(e && (e.message || e.error || e) || '');
        if (i < 3 && /SSL|SSLSessionState|timeout|timed out|超时|reset|connection|network|stream|closed|EOF|socket/i.test(m)) {
          await $.wait(1500);
          continue;
        }
        break;
      }
    }
    throw lastErr || new Error('请求失败');
  }
  // 查询余额
  async query(last) {
    try {
      const d = await this.fetchApi('queryBalanceAndBonus');
      if (d.retcode === 0) {
        this.balance = d.result && d.result.balance;
        this.log(`${last ? '💰 最新余额' : '💰 余额'}：${this.balance} Coins`);
      } else {
        this.log(`⚠️ 查询：${d.retmsg}`);
        if (isDeregistered(d.retmsg)) this.deregistered = true;
      }
    } catch (e) {
      this.log(`❌ 查询：${e && (e.message || e) || e}`);
    }
  }
  // 签到
  async checkIn() {
    try {
      const d = await this.fetchApi('checkIn');
      if (d.retcode === 0) this.log(`✅ 签到：${String((d.result && d.result.bonusHint) || d.retmsg || '').replace(/\n/g, ' ')}`);
      else {
        this.log(`⚠️ 签到：${d.retmsg}`);
        if (isDeregistered(d.retmsg)) this.deregistered = true;
      }
    } catch (e) {
      this.log(`❌ 签到：${e && (e.message || e) || e}`);
    }
  }
  // 视频奖励
  async videoLoop(count) {
    for (let i = 1; i <= count; i++) {
      await $.wait(i === 1 ? 1500 : VIDEO_DELAY);
      try {
        const d = await this.fetchApi('videoBonus', true);
        if (d.retcode === 0) this.log(`🎬 视频${i}：+${(d.result && d.result.bonus) || '?'} Coins`);
        else {
          this.log(`⏸ 视频${i}：${d.retmsg}`);
          break;
        }
      } catch (e) {
        this.log(`❌ 视频${i}：${e && (e.message || e) || e}`);
        break;
      }
    }
  }
  async run() {
    this.msgs.push(`${this.tag}${this.email ? `\n📧 ${this.email}` : ''}`);
    await this.query(false);
    if (this.deregistered) return this.finish();
    await this.checkIn();
    if (this.deregistered) return this.finish();
    await this.videoLoop(MAX_VIDEO);
    if (this.deregistered) return this.finish();
    await this.query(true);
    return this.finish();
  }
  finish() {
    if (this.deregistered) this.msgs.push('🗑 该账号已注销，将从存储中移除');
    return { id: this.id, text: this.msgs.join('\n'), deregistered: this.deregistered, alias: this.alias, email: this.email };
  }
}

//-------------------------- 抓包入口 -----------------------------------
async function getCookie() {
  if (!$request || $request.method === 'OPTIONS') return;

  const headersMap = Object.assign({}, $request.headers || {});
  const paramsRaw = parseRawQuery($request.url);
  const baseUA = pickUAFromHeaders(headersMap);

  const store = loadStore();
  const fp = fingerprintOf(paramsRaw);
  const now = Date.now();
  const existed = !!store.accounts[fp];
  const alias = existed ? store.accounts[fp].alias : `账号${store.order.length + 1}`;
  const uaSeed = existed ? store.accounts[fp].uaSeed : store.order.length;
  const email = decodeSafe(paramsRaw.email);

  store.accounts[fp] = {
    id: fp,
    alias,
    email,
    uaSeed,
    baseUA,
    capture: { url: $request.url, paramsRaw, headers: headersMap },
    createdAt: existed ? store.accounts[fp].createdAt : now,
    updatedAt: now
  };
  if (!existed) store.order.push(fp);
  saveStore(store);

  const title = existed ? '🔄 账号参数已更新' : '✅ 新账号已入库';
  const text = `${title}\n${alias}（id:${fp}）${email ? `\n📧 ${email}` : ''}\n当前账号总数：${store.order.length}`;
  debug(store.accounts[fp], 'capture');
  DoubleLog(text);
  $.title = title;
}

//-------------------------- 主程序 -----------------------------------
async function main() {
  try {
    $.log('\n================== 任务 ==================\n');
    const store = userCookie;
    const ids = store.order.filter(id => store.accounts[id]);
    if (!ids.length) {
      const msg = '未抓到任何账号，请先打开 PingMe 触发抓包（或 Node 环境配置 pingme_data）';
      $.log(`⚠️ ${msg}`);
      $.notifyMsg.push(`⚠️ ${msg}`);
      return;
    }
    const total = ids.length;
    $.log(`共找到${total}个账号`);
    const deadIds = [];
    const results = [];
    for (let i = 0; i < total; i++) {
      const acc = store.accounts[ids[i]];
      $.log(`🔷账号${i + 1} >> Start work`);
      const user = new PingMeAccount(acc, i, total);
      let r = null;
      try {
        r = await user.run();
      } catch (e) {
        user.log(`❌ 异常：${e && (e.message || e) || e}`);
        r = user.finish();
      }
      results.push(r);
      if (r.deregistered) deadIds.push(r.id);
      if (i < total - 1) await $.wait(ACCOUNT_GAP);
    }

    let extra = '';
    if (deadIds.length) {
      const fresh = loadStore();
      const removed = removeAccounts(fresh, deadIds);
      saveStore(fresh);
      if (removed.length) extra = `\n———\n🗑 已移除注销账号：${removed.join('、')}（剩余${fresh.order.length}个）`;
    }
    $.title = `🎉 ${$.name} 全部完成（${total}个账号）`;
    DoubleLog(results.map(r => r.text).join('\n———\n') + extra);
  } catch (e) {
    $.log(`⛔️ main run error => ${e}`);
    $.notifyMsg.push(`⛔️ main run error => ${e && (e.message || e) || e}`);
  }
}

//-------------------------- 辅助函数区域 -----------------------------------
//汇总进通知（实时日志已由 $.log 输出，这里只负责拼通知内容，避免控制台重复）
function DoubleLog(data) {
  if (data) $.notifyMsg.push(`${data}`);
}
//调试
function debug(t, l = 'debug') {
  if ($.is_debug === 'true') {
    $.log(`\n-----------${l}------------\n`);
    $.log(typeof t == "string" ? t : $.toStr(t) || `debug error => t=${t}`);
    $.log(`\n-----------${l}------------\n`);
  }
}
//账号通知
async function SendMsg(n, o) {
  n && (0 < Notify ? $.isNode() ? (notify && notify.sendNotify ? await notify.sendNotify($.name, n) : console.log(n)) : $.msg($.name, $.title || "", n, { "media-url": o }) : console.log(n));
}

//---------------------- 主程序执行入口 -----------------------------------
!(async () => {
  if (typeof $request !== "undefined" && $request && $request.url) {
    await getCookie();
  } else {
    await main();
  }
})()
  .catch(e => $.notifyMsg.push(`⛔️ ${e && (e.message || e) || e}`))
  .finally(async () => {
    // 所有账号合并成一条通知，避免多账号时刷屏
    const summary = $.notifyMsg.join('\n');
    if (summary) await SendMsg(summary);
    $.done({ ok: 1 });
  });

/** ---------------------------------固定不动区域----------------------------------------- */
// prettier-ignore
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, r) => { s.call(this, t, ((t, s, a) => { t ? r(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, r) => e(r))) })) } runScript(t, e) { return new Promise((s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, ((t, e, r) => s(r))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s = void 0) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) })) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then((t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) })) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: return { url: t.url || t.openUrl || t["open-url"] }; case "Loon": return { openUrl: t.openUrl || t.url || t["open-url"], mediaUrl: t.mediaUrl || t["media-url"] }; case "Quantumult X": return { "open-url": t["open-url"] || t.url || t.openUrl, "media-url": t["media-url"] || t.mediaUrl, "update-pasteboard": t["update-pasteboard"] || t.updatePasteboard }; case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }

