/**
 * 脚本名称：柠季
 * 活动规则：每日签到
 * 脚本说明：添加重写进入"柠季"小程序-顶部轮播图-4月签到界面，即可获取 Token，支持多账号，兼容🐉青龙。
 * 环境变量：ningji_data=[{"cardId": "抓包响应体cardId","campaignId":"抓包请求头campaignId","token": "抓包* 抓包请求头x-token"}]
 * 更新时间：2024-06-01 00:47
 * 图标地址：https://raw.githubusercontent.com/leiyiyan/resource/main/icons/ningji.png

------------------ Surge 配置 ------------------

[MITM]
hostname = %APPEND% pos.meituan.com

[Script]
柠季Token = type=http-response,pattern=^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display,requires-body=1,max-size=0,binary-body-mode=0,timeout=30,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,script-update-interval=0

柠季 = type=cron,cronexp=30 9 * * *,timeout=60,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,script-update-interval=0

------------------- Loon 配置 -------------------

[MITM]
hostname = pos.meituan.com

[Script]
http-response ^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display tag=柠季²,script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,requires-body=1

cron "30 9 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js,tag=柠季,enable=true

--------------- Quantumult X 配置 ---------------

[MITM]
hostname = pos.meituan.com

[rewrite_local]
^https?:\/\/pos\.meituan\.com\/api\/v1\/crm\/frontend\/campaign\/display url script-response-body https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js

[task_local]
30 9 * * * https://raw.githubusercontent.com/leiyiyan/resource/main/script/ningji/ningji.js, tag=柠季, img-url=https://raw.githubusercontent.com/leiyiyan/resource/main/icons/ningji.png, enabled=true

 */

const $ = new Env('柠季');
$.is_debug = getEnv('is_debug') || 'false';  // 调试模式
$.userInfo = getEnv('ningji_data') || '';  // Token
$.userArr = $.toObj($.userInfo) || [];  // 用户数组
$.appid = 'wx177c513cc05c325d';  // 小程序 appId
$.tenantid = '10159618'
$.orgid = '429605'
$.csecversionname = '5.60.58'
$.csecversion = '1.4.0'
$.messages = [];
$.campaignId = "1005486520";

// 主函数
async function main() {
  if ($.userArr.length) {
    $.log(`✅ 找到: ${$.userArr.length} 个账号`);
    for (let i = 0; i < $.userArr.length; i++) {
      $.log(`----- 账号 [${i + 1}] 开始执行 -----`);
      // 初始化
      $.is_login = true;
      $.token = $.userArr[i]['token'];
      $.cardId = $.userArr[i]['cardId'];
      //$.campaignId = $.userArr[i]['campaignId'];
      $.headers = {
        'referer': `https://servicewechat.com/${$.appid}/169/page-frame.html`,
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.46(0x18002e2c) NetType/WIFI Language/zh_CN',
        'content-type': 'application/json',
        'x-token': $.token,
        'orgid': $.orgid,
        'poitype': '1',
        'tenantid': $.tenantid,
        'poiid': '0'
      }

      // 获取用户信息, 不打印日志
      await getUserInfo();
      await $.wait(1000);
      // 无效 token 跳出
      if (!$.is_login) continue;  
      
      // 签到
      await signin();
      await $.wait(1000);
      // 获取用户信息, 打印日志
      await getUserInfo(true);
    }
    $.log(`----- 所有账号执行完成 -----`);
  } else {
    throw new Error('⛔️ 未找到账号');
  }
}

// 签到
async function signin() {
  let msg = '';
  // 构造请求
  let opt = {
    url: `https://pos.meituan.com/api/v1/crm/frontend/campaign/sign-in/participate`,
    headers: $.headers,
    params: {
      yodaReady: 'wx',
      csecappid: $.appid,
      csecplatform: '3',
      csecversionname: $.csecversionname,
      csecversion: $.csecversion
    },
    body: $.toStr({
      campaignId: $.campaignId,
      cardId: $.cardId,
      couponDisplayScene: 44,
      styleVersion: 2
    })
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.code == 0 && result?.issuedCouponDisplayInfos && result?.issuedPointAmount) {
    const { issuedPointAmount, issuedCouponDisplayInfos } = result;
    
    msg += `✅ 签到:获得${issuedPointAmount}积分 ${issuedCouponDisplayInfos[0]?.displayData?.name?.value || ''}\n`;
  } else if (result?.code == 90600 || result?.code == 500) {
    msg += `⛔️ 签到:${result?.msg}\n`;
  } else {
    msg += `⛔️ 签到信息失败\n`;
    $.log($.toStr(result));
  }
  $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
}


// 获取用户信息
async function getUserInfo(isShowMsg = false) {
  let msg = '';
  // 构造请求
  let opt = {
    url: `https://rms.meituan.com/api/v1/rmsmina/c/comp/member/memberinfo`,
    headers: $.headers,
    params: {
      mtShopId: '',
      yodaReady: 'wx',
      csecappid: $.appid,
      csecplatform: '3',
      csecversionname: $.csecversionname,
      csecversion: $.csecversion
    },
    body: $.toStr({
      cardId: $.cardId,
      showNickName: "true",
      showAvatarUrl: "true",
      showMemberGrade: "true",
      showAssertList: "[1,2,3]",
      showCardTitle: "true",
      showProgressBar: "true",
      showMemberCodeUrl: "true"
    })
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.code == 200 && result?.data) {
    const { nickName, assets } = result?.data;
    if(isShowMsg) {
      msg += `✅ 账号: ${nickName}`;
      for(let item of assets) {
        msg += `,${item.name}:${item.value}`;
      }
    }
  } else if (result?.code == 400) {
    $.is_login = false;  // Token 失效
    msg += `⛔️ ${result?.message} \n`;
  } else {
    msg += `⛔️ 获取用户信息失败\n`;
    $.log($.toStr(result));
  }
  if(isShowMsg) {
    $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
  }
}


// 脚本执行入口
!(async () => {
  if (typeof $request !== `undefined`) {
    GetCookie();
  } else {
    await main();  // 主函数
  }
})()
  .catch((e) => $.messages.push(e.message || e) && $.logErr(e))
  .finally(async () => {
    await sendMsg($.messages.join('\n').trimStart().trimEnd());  // 推送通知
    $.done();
  })



// 获取用户数据
function GetCookie() {
  try {
    let msg = '';
    debug($response.body);
    const header = ObjectKeys2LowerCase($request.headers);
    const token = header['x-token'];
    const campaignId = header['campaignid'];
    const body = $.toObj($response.body);
    const { cardId } = body?.data?.userInfo?.cardInfo;
    if (token && cardId) {
      const user = $.userArr.find(user => user.cardId === cardId);
      if (user) {
        msg += `更新用户 [${cardId}] Token: ${token}\n`;
        user.token = token;
        user.campaignId = campaignId;
      } else {
        msg += `新增用户 [${cardId}] Token: ${token}\n`;
        $.userArr.push({ "cardId": cardId, "campaignId": campaignId, "token": token });
      }
      // 写入数据持久化
      $.setdata($.toStr($.userArr), 'ningji_data');
      $.messages.push(msg.trimEnd()), $.log(msg.trimEnd());
    }
  } catch (e) {
    $.log("⛔️ 获取Cookie失败"), $.log(e);
  }
}


// 获取环境变量
function getEnv(...keys) {
  for (let key of keys) {
    var value = $.isNode() ? process.env[key] || process.env[key.toUpperCase()] || process.env[key.toLowerCase()] || $.getdata(key) : $.getdata(key);
    if (value) return value;
  }
}



/**
 * 请求函数二次封装
 * @param {(object|string)} options - 构造请求内容，可传入对象或 Url
 * @returns {(object|string)} - 根据 options['respType'] 传入的 {status|headers|rawBody} 返回对象或字符串，默认为 body
 */
async function Request(options) {
  try {
    options = options.url ? options : { url: options };
    const _method = options?._method || ('body' in options ? 'post' : 'get');
    const _respType = options?._respType || 'body';
    const _timeout = options?._timeout || 15e3;
    const _http = [
      new Promise((_, reject) => setTimeout(() => reject(`⛔️ 请求超时: ${options['url']}`), _timeout)),
      new Promise((resolve, reject) => {
        debug(options, '[Request]');
        $[_method.toLowerCase()](options, (error, response, data) => {
          debug(response, '[response]');
          error && $.log($.toStr(error));
          if (_respType !== 'all') {
            resolve($.toObj(response?.[_respType], response?.[_respType]));
          } else {
            resolve(response);
          }
        })
      })
    ];
    return await Promise.race(_http);
  } catch (err) {
    $.logErr(err);
  }
}


// 发送消息
async function sendMsg(message) {
  if (!message) return;
  try {
    if ($.isNode()) {
      try {
        var notify = require('./sendNotify');
      } catch (e) {
        var notify = require('./utils/sendNotify');
      }
      await notify.sendNotify($.name, message);
    } else {
      $.msg($.name, '', message);
    }
  } catch (e) {
    $.log(`\n\n----- ${$.name} -----\n${message}`);
  }
}


/**
 * DEBUG
 * @param {*} content - 传入内容
 * @param {*} title - 标题
 */
function debug(content, title = "debug") {
  let start = `\n----- ${title} -----\n`;
  let end = `\n----- ${$.time('HH:mm:ss')} -----\n`;
  if ($.is_debug === 'true') {
    if (typeof content == "string") {
      $.log(start + content + end);
    } else if (typeof content == "object") {
      $.log(start + $.toStr(content) + end);
    }
  }
}

//转换为小写
function ObjectKeys2LowerCase(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };

// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, r) => { s.call(this, t, (t, s, a) => { t ? r(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; const r = this.getdata(t); if (r) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, r) => e(r)) }) } runScript(t, e) { return new Promise(s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, (t, e, r) => s(r)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then(t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, r = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": r } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
