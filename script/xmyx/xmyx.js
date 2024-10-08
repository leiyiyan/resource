/*
new Env('星妈优选');
@Author: Leiyiyan
@Date: 2024-10-08 15:05

@Description:
星妈优选小程序 每日签到、任务

图标： https://raw.githubusercontent.com/leiyiyan/resource/main/icons/xmyx.png

[Script]
http-response ^https?:\/\/www\.feihevip\.com\/api\/starMember\/getMemberInfo script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/xmyx/xmyx.js, requires-body=true, timeout=60, tag=星妈优选获取Cookie
cron "30 0 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/xmyx/xmyx.js, tag=星妈优选日常任务

[MITM]
hostname = www.feihevip.com

====================================
⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。
 */


const $ = new Env("星妈优选");
const ckName = "xmyx_data";

//-------------------- 一般不动变量区域 -------------------------------------
$.appid = "wx4205ec55b793245e";
const Notify = 1;//0为关闭通知,1为打开通知,默认为1
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ["@"]; //多账号分隔符
// var userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
var userCookie = ($.isNode() ? require('./xmyx_token.json') : $.getdata(ckName)) || '';
let userList = [];
let userIdx = 0;
let userCount = 0;
// 调试
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
// 为多用户准备的通知数组
$.notifyList = [];
// 为通知准备的空数组
$.notifyMsg = [];

//---------------------- 自定义变量区域 -----------------------------------
const appid = 'xmyx'
const appKey = 'TwUQ01lKS1Km5zlV2f7amsZc5EQYkTbv'
const taskList = [
  { taskName: "浏览粮油专场10秒", taskType: "XXGG", time: 11 },
  { taskName: "浏览热销榜单10秒", taskType: "LLZTY", time: 11 },
  { taskName: "浏览视频10秒", taskType: "LLSP", time: 11 },
  { taskName: "打开签到提醒", taskType: "YXDY", time: 3 },
  { taskName: "大转盘抽奖", taskType: "YXDZP", time: 3 },
  { taskName: "购买任意商品1次", taskType: "YXXD", time: 3 },
  { taskName: "查看优惠券", taskType: "LLYHJ", time: 3 },
  { taskName: "补签赚积分", taskType: "YXBQ", time: 3 }
]
//---------------------- 脚本入口函数 -----------------------------------
async function main() {
  try {
    $.log('\n================== 任务 ==================\n');
    for (let user of userList) {
      console.log(`🔷账号${user.index} >> Start work`)
      const flag = await user.signin();
      if (user.ckStatus) {
        // 完成任务
        if(flag) {
          for(let task of taskList) {
            await user.tofinish(task.taskName, task.taskType);
            await $.wait(1000 * task.time)
            await user.completeTask(task.taskName, task.taskType);
            await $.wait(user.getRandomTime());
          }
        }
        // 查询用户信息
        const { score, level, userName, avatar } = await user. getUserInfo() ?? {};
        user.avatar = avatar;
        await user.refreshToken(user.token);
        $.title = `今日任务已全部完成`;
        DoubleLog(`「${userName}」积分: ${score}, 等级: ${level}`);
      } else {
        //将ck过期消息存入消息数组
        $.notifyMsg.push(`❌账号${userName || user.index} >> Check ck error!`)
      }
      //账号通知
      $.notifyList.push({ "id": user.index, "avatar": user.avatar, "message": $.notifyMsg });
      //清空数组
      $.notifyMsg = [];
    }
  } catch (e) {
    $.log(`⛔️ main run error => ${e}`);
    throw new Error(`⛔️ main run error => ${e}`);
  }
}
class UserInfo {
  constructor(user) {
    //默认属性
    this.index = ++userIdx;
    this.token = user.token || user;
    this.userId = user.userId;
    this.userName = user.userName;
    this.avatar = user.avatar;
    this.ckStatus = true;
    this.doFlag = { "true": "✅", "false": "⛔️" };
    //请求封装
    this.baseUrl = ``;
    this.host = "https://www.feihevip.com/api";
    this.headers = {
      "Host": "www.feihevip.com",
      "token": this.token,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302b) NetType/4G Language/zh_CN",
      "Referer": "https://servicewechat.com/wx4205ec55b793245e/215/page-frame.html",
      "fhAppid": appid,
      "source": 1
    }
    
    this.getRandomTime = () => randomInt(1e3, 3e3);
    this.fetch = async (o) => {
      try {
        if (typeof o === 'string') o = { url: o };
        if (o?.url?.startsWith("/")) o.url = this.host + o.url
        const res = await Request({ ...o, headers: o.headers || this.headers, url: o.url || this.baseUrl })
        // debug(res, o?.url?.replace(/\/+$/, '').substring(o?.url?.lastIndexOf('/') + 1));
        if (res?.code == 40001) throw new Error(res?.message || `用户需要去登录`);
        return res;
      } catch (e) {
        this.ckStatus = false;
        $.log(`⛔️ 请求发起失败！${e}`);
      }
    }
  }
  
  // 签到
  async signin() {
    try {
      const { fhNonceStr, fhTimestamp, fhSign } = getSignature();
      const opts = {
        url: '/member/signin/getSignInfo',
        type: "get",
        params: {
          signType: 1
        },
        headers: Object.assign({}, this.headers, {
          fhNonceStr,
          fhTimestamp,
          fhSign
        })
      }
      const res = await this.fetch(opts);
      const {signPop} = res?.data;
      const point = signPop ? signPop[0]?.signPoint : 0;
      debug(res, `今日签到`)
      $.log(`✅ ${res?.code == '200' ? point == 0 ? '今日已签到，请勿重复执行' : `签到完成, 获取积分: ${point}分` : res?.msg}\n`);
      if(res?.code == '200' && point == 0) {
        return false
      }
      return true
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 执行任务今日签到失败! ${e}`);
    }
  }
  // 执行任务
  async tofinish(taskName, taskType) {
    try {
      const { fhNonceStr, fhTimestamp, fhSign } = getSignature();
      const opts = {
        url: '/member/signin/tofinish',
        type: "get",
        params: {
          taskType
        },
        headers: Object.assign({}, this.headers, {
          fhNonceStr,
          fhTimestamp,
          fhSign
        })
      }
      const res = await this.fetch(opts);
      debug(res, `执行任务: ${taskName}`)
      $.log(`🚀 ${res?.code == '200' ? '开始执行任务: ' + taskName : res?.msg}\n`);
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 执行任务${taskName}失败! ${e}`);
    }
  }
  
  // 完成任务
  async completeTask(taskName, taskType) {
    try {
      const { fhNonceStr, fhTimestamp, fhSign } = getSignature();
      const opts = {
        url: '/member/signin/completeTask',
        type: "get",
        params: {
          taskType
        },
        headers: Object.assign({}, this.headers, {
          fhNonceStr,
          fhTimestamp,
          fhSign
        })
      }
      const res = await this.fetch(opts);
      debug(res, `完成任务: ${taskName}`)
      if(res?.code == '200') {
        if(res?.data) {
          const point = res?.data?.awardSendPoints;
          $.log(`✅ 完成任务: ${taskName}, 获取积分: ${point}分\n`);
        }else{
          $.log(`✅ 任务: ${taskName} 已完成，请勿重复执行\n`);
        }
      }else{
        $.log(`⛔️ '完成任务: ${taskName} 失败! ${res?.msg}\n`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 完成任务${taskName}失败! ${e}`);
    }
  }
  // 获取用户信息
  async getUserInfo() {
    try {
      const { fhNonceStr, fhTimestamp, fhSign } = getSignature({});
      const opts = {
        url: '/starMember/getMemberInfo',
        type: "post",
        dataType: "json",
        headers: Object.assign({}, this.headers, {
          fhNonceStr,
          fhTimestamp,
          fhSign
        }),
        body: {}
      }
      const res = await this.fetch(opts);
      debug(res, `查询用户信息`)
      if(res?.code == '200' && res?.data) {
        // 积分
        const score = res?.data?.memberPoints?.scoreValue;
        // 等级
        const level = res?.data?.memberGrade?.currentGrade;
        // 用户名
        const userName = res?.data?.baseInfo?.nickName;
        // 头像
        const avatar = res?.data?.baseInfo?.headImgUrl;
        return { score, level, userName, avatar };
      }else{
        $.log(`⛔️ '查询用户信息失败! ${res?.msg}\n`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 查询用户信息失败! ${e}`);
    }
  }
  // 刷新token
  async refreshToken(token) {
    try {
      const { fhNonceStr, fhTimestamp, fhSign } = getSignature2();
      const options = {
        url: `https://mom.feihe.com/program/token/refreshToken`,
        type: "get",
        headers: {
          "Host": "mom.feihe.com",
          "token": token,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302b) NetType/4G Language/zh_CN",
          "Referer": "https://servicewechat.com/wx4205ec55b793245e/215/page-frame.html",
          "fhAppid": 'xmh',
          "source": 1,
          fhNonceStr,
          fhTimestamp,
          fhSign
        }
      };
      //post方法
      let result = await Request(options);
      let refreshToken = result?.data;
      for(let i = 0; i < userCookie.length; i++) {
        if(userCookie[i].userId === this.userId) {
          userCookie[i].token = refreshToken;
        }
      }
      $.isNode() ? require('fs').writeFileSync('./xmyx_token.json', JSON.stringify(userCookie)) : $.setdata(JSON.stringify(userCookie), ckName);
      $.log(`🎉 刷新 token 成功\n`)
      debug(result, '获取token');
      // return refreshToken;
    } catch (e) {
      $.log(`⛔️ 刷新 Token 失败: ${e}`)
    }
  }
}
async function getCookie() {
  if ($request && $request.method === 'OPTIONS') return;

  const header = ObjectKeys2LowerCase($request.headers);
  const token = header.token;
  const body = $.toObj($response.body);
  if (!(body?.data)) {
    $.msg($.name, `❌获取Cookie失败!`, "")
    return;
  }
  // 积分
  const score = body?.data?.memberPoints?.scoreValue;
  // ID
  const unionId = body?.data?.unionId;
  // 用户名
  const userName = body?.data?.baseInfo?.nickName;
  // 头像
  const avatar = body?.data?.baseInfo?.headImgUrl;

  const newData = {
    "userId": unionId,
    "avatar": avatar,
    "token": token,
    "userName": userName,
  }

  userCookie = userCookie ? JSON.parse(userCookie) : [];
  const index = userCookie.findIndex(e => e.userId == newData.userId);

  userCookie[index] ? userCookie[index] = newData : userCookie.push(newData);

  $.setjson(userCookie, ckName);
  $.msg($.name, `🎉${newData.userName}更新token成功!`, ``);
}
//自动生成token
async function getWxToken(code) {
  try {
    const { fhNonceStr, fhTimestamp, fhSign } = getSignature({code});
    const options = {
      url: `https://www.feihevip.com/api/wechat/auth/miniAssets`,
      type: "post",
      dataType: "json",
      headers: {
        "Host": "www.feihevip.com",
        "token": '',
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302b) NetType/4G Language/zh_CN",
        "Referer": "https://servicewechat.com/wx4205ec55b793245e/215/page-frame.html",
        "fhAppid": appid,
        "source": 1,
        fhNonceStr,
        fhTimestamp,
        fhSign
      },
      body: {
        code
      }
    };
    //post方法
    let result = await Request(options);
    let token = result?.data?.token;
    debug(result, '获取token');
    return token;
  } catch (e) {
    $.log(`❌getWxToken run error => ${e}`)
  }
}

//检查code服务器
async function checkCodeServer(appid) {
  // 环境变量
  $.codeServer = $.isNode() ? process.env["CODESERVER_ADDRESS"] : $.getdata('@codeServer.address');
  // 需要获取的微信列表，用,分隔
  $.wxId = ($.isNode() ? process.env["CODESERVER_WXID"] : $.getdata('@codeServer.wxId')).split(",");
  // 获取codeList
  let codeList = await Promise.all($.wxId.map(e => getCode(e)));
  async function getCode(wxId) {
    try {
      const options = {
        url: `${$.codeServer}/api/Common/JSLogin`,
        headers: { "accept": "application/json", "content-type": "application/json" },
        body: JSON.stringify({
          'wxId': wxId,
          'appId': appid
        })
      };
      let res = await $.http.post(options);
      res = $.toObj(res?.body);
      return res?.Data?.code;
    } catch (e) {
      $.log(e);
    }
  }
    debug(codeList);
    !codeList.length
      ? $.log(`❌获取code授权失败！请检查服务器运行是否正常 => 尝试读取数据持久化 `)
      : $.log(`✅获取code授权成功！当前code数量为${codeList.length}`);
    let userList = await Promise.all(codeList.map(async (code) => {
      const token = await getWxToken(code);
      const newToken = await refreshToken(token);
      debug(newToken)
      return { "token": newToken };
    }));
    userList = userList.filter(value => Object.keys(value).length !== 0)
    return userList;
}
//检查环境变量
async function checkEnv() {

  try {
    let usersToAdd = [];

    if (!usersToAdd.length) {
      const e = envSplitor.find(o => userCookie.includes(o)) || envSplitor[0];
      userCookie = Array.isArray(userCookie) ? userCookie : $.toObj(userCookie);
      usersToAdd = userCookie;
    }
    userList.push(...usersToAdd.map(n => new UserInfo(n)).filter(Boolean));

    userCount = userList.length;
    console.log(`共找到${userCount}个账号`);
    return true;
  } catch (e) {
    throw new Error(`❌checkEnv run error => ${e}`)
  }
}
//请求二次封装
async function Request(o) {
  if (typeof o === 'string') o = { url: o };
  try {
    if (!o?.url) throw new Error('[发送请求] 缺少 url 参数');
    // type => 因为env中使用method处理post的特殊请求(put/delete/patch), 所以这里使用type
    let { url: u, type, headers = {}, body: b, params, dataType = 'form', resultType = 'data' } = o;
    // post请求需要处理params参数(get不需要, env已经处理)
    const method = type ? type?.toLowerCase() : ('body' in o ? 'post' : 'get');
    const url = u.concat(method === 'post' ? '?' + $.queryStr(params) : '');

    const timeout = o.timeout ? ($.isSurge() ? o.timeout / 1e3 : o.timeout) : 1e4
    // 根据jsonType处理headers
    if (dataType === 'json') headers['Content-Type'] = 'application/json;charset=UTF-8';
    // post请求处理body
    const body = b && dataType == 'form' ? $.queryStr(b) : $.toStr(b);
    const request = { ...o, ...(o?.opts ? o.opts : {}), url, headers, ...(method === 'post' && { body }), ...(method === 'get' && params && { params }), timeout: timeout }
    const httpPromise = $.http[method.toLowerCase()](request)
      .then(response => resultType == 'data' ? ($.toObj(response.body) || response.body) : ($.toObj(response) || response))
      .catch(err => $.log(`❌请求发起失败！原因为：${err}`));
    // 使用Promise.race来强行加入超时处理
    return Promise.race([
      new Promise((_, e) => setTimeout(() => e('当前请求已超时'), timeout)),
      httpPromise
    ]);
  } catch (e) {
    console.log(`❌请求发起失败！原因为：${e}`);
  }
};
//生成随机数
function randomInt(n, r) {
  return Math.round(Math.random() * (r - n) + n)
};
//控制台打印
function DoubleLog(data) {
  if (data && $.isNode()) {
    console.log(`${data}`);
    $.notifyMsg.push(`${data}`)
  } else if (data) {
    console.log(`${data}`);
    $.notifyMsg.push(`${data}`)
  }
};
//调试
function debug(t, l = 'debug') {
  if ($.is_debug === 'true') {
    $.log(`\n-----------${l}------------\n`);
    $.log(typeof t == "string" ? t : $.toStr(t) || `debug error => t=${t}`);
    $.log(`\n-----------${l}------------\n`)
  }
};
//对多账号通知进行兼容
async function SendMsgList(l) {
  await Promise.allSettled(l?.map(u => SendMsg(u.message.join('\n'), u.avatar)));
};
//账号通知
async function SendMsg(n, o) {
  n && (0 < Notify ? $.isNode() ? await notify.sendNotify($.name, n) : $.msg($.name, $.title || "", n, {
    "media-url": o
  }) : console.log(n))
};
//转换为小写
function ObjectKeys2LowerCase(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) };

// 获取签名
function getSignature(data) {
  const json = data ? JSON.stringify(data) : ''
  const fhNonceStr = getFhNonceStr({ length: 16 })
  const fhTimestamp = getTimestamp()
  const signString = `fhAppid${appid}fhNonceStr${fhNonceStr}fhTimestamp${fhTimestamp}${json}${appKey}`
  // debug(signString + '->' + md5(signString).toUpperCase(), '签名字符串')
  return {
    fhNonceStr,
    fhTimestamp,
    fhSign: md5(signString).toUpperCase()
  }
}
function getSignature2() {
  const fhNonceStr = getFhNonceStr({ length: 16 })
  const fhTimestamp = getTimestamp()
  const signString = `fhAppidxmhfhNonceStr${fhNonceStr}fhTimestamp${fhTimestamp}98d9fe9b613a479dbcb111ca261e3ce1`
  // debug(signString + '->' + md5(signString).toUpperCase(), '签名字符串')
  return {
    fhNonceStr,
    fhTimestamp,
    fhSign: md5(signString).toUpperCase()
  }
}
// 获取10位时间戳
function getTimestamp() {
  return +String(Date.now()).slice(0, 10)
}
// 获取随机字符串
function getFhNonceStr(t) { var e, r, n = "", o = (t = function (t) { return t || (t = {}), { length: t.length || 8, numeric: "boolean" != typeof t.numeric || t.numeric, letters: "boolean" != typeof t.letters || t.letters, special: "boolean" == typeof t.special && t.special, exclude: Array.isArray(t.exclude) ? t.exclude : [] } }(t)).length; t.exclude; var i = function (t) { var e = ""; t.numeric && (e += "0123456789"), t.letters && (e += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"), t.special && (e += "!$%^&*()_+|~-=`{}[]:;<>?,./"); for (var r = 0; r <= t.exclude.length; r++)e = e.replace(t.exclude[r], ""); return e }(t); for (e = 1; e <= o; e++)n += i.substring(r = Math.floor(Math.random() * i.length), r + 1); return n }

//---------------------- 主程序执行入口 -----------------------------------
!(async () => {
  if (typeof $request != "undefined") {
    await getCookie();
  } else {
    if (!(await checkEnv())) throw new Error(`❌未检测到ck，请添加环境变量`);
    if (userList.length > 0) await main();
  }
})()
  .catch(e => $.notifyMsg.push(e.message || e))
  .finally(async () => {
    await SendMsgList($.notifyList);
    $.done({ ok: 1 });
  });
/** ---------------------------------固定不动区域----------------------------------------- */
// prettier-ignore
//From chavyleung's Env.js
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, r) => { s.call(this, t, ((t, s, a) => { t ? r(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, r) => e(r))) })) } runScript(t, e) { return new Promise((s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, ((t, e, r) => s(r))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s = void 0) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) })) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then((t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) })) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: return { url: t.url || t.openUrl || t["open-url"] }; case "Loon": return { openUrl: t.openUrl || t.url || t["open-url"], mediaUrl: t.mediaUrl || t["media-url"] }; case "Quantumult X": return { "open-url": t["open-url"] || t.url || t.openUrl, "media-url": t["media-url"] || t.mediaUrl, "update-pasteboard": t["update-pasteboard"] || t.updatePasteboard }; case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }

// md5
function md5(md5str) {
  var createMD5String = function (string) { var x = Array(); var k, AA, BB, CC, DD, a, b, c, d; var S11 = 7, S12 = 12, S13 = 17, S14 = 22; var S21 = 5, S22 = 9, S23 = 14, S24 = 20; var S31 = 4, S32 = 11, S33 = 16, S34 = 23; var S41 = 6, S42 = 10, S43 = 15, S44 = 21; string = uTF8Encode(string); x = convertToWordArray(string); a = 1732584193; b = 4023233417; c = 2562383102; d = 271733878; for (k = 0; k < x.length; k += 16) { AA = a; BB = b; CC = c; DD = d; a = FF(a, b, c, d, x[k + 0], S11, 3614090360); d = FF(d, a, b, c, x[k + 1], S12, 3905402710); c = FF(c, d, a, b, x[k + 2], S13, 606105819); b = FF(b, c, d, a, x[k + 3], S14, 3250441966); a = FF(a, b, c, d, x[k + 4], S11, 4118548399); d = FF(d, a, b, c, x[k + 5], S12, 1200080426); c = FF(c, d, a, b, x[k + 6], S13, 2821735955); b = FF(b, c, d, a, x[k + 7], S14, 4249261313); a = FF(a, b, c, d, x[k + 8], S11, 1770035416); d = FF(d, a, b, c, x[k + 9], S12, 2336552879); c = FF(c, d, a, b, x[k + 10], S13, 4294925233); b = FF(b, c, d, a, x[k + 11], S14, 2304563134); a = FF(a, b, c, d, x[k + 12], S11, 1804603682); d = FF(d, a, b, c, x[k + 13], S12, 4254626195); c = FF(c, d, a, b, x[k + 14], S13, 2792965006); b = FF(b, c, d, a, x[k + 15], S14, 1236535329); a = GG(a, b, c, d, x[k + 1], S21, 4129170786); d = GG(d, a, b, c, x[k + 6], S22, 3225465664); c = GG(c, d, a, b, x[k + 11], S23, 643717713); b = GG(b, c, d, a, x[k + 0], S24, 3921069994); a = GG(a, b, c, d, x[k + 5], S21, 3593408605); d = GG(d, a, b, c, x[k + 10], S22, 38016083); c = GG(c, d, a, b, x[k + 15], S23, 3634488961); b = GG(b, c, d, a, x[k + 4], S24, 3889429448); a = GG(a, b, c, d, x[k + 9], S21, 568446438); d = GG(d, a, b, c, x[k + 14], S22, 3275163606); c = GG(c, d, a, b, x[k + 3], S23, 4107603335); b = GG(b, c, d, a, x[k + 8], S24, 1163531501); a = GG(a, b, c, d, x[k + 13], S21, 2850285829); d = GG(d, a, b, c, x[k + 2], S22, 4243563512); c = GG(c, d, a, b, x[k + 7], S23, 1735328473); b = GG(b, c, d, a, x[k + 12], S24, 2368359562); a = HH(a, b, c, d, x[k + 5], S31, 4294588738); d = HH(d, a, b, c, x[k + 8], S32, 2272392833); c = HH(c, d, a, b, x[k + 11], S33, 1839030562); b = HH(b, c, d, a, x[k + 14], S34, 4259657740); a = HH(a, b, c, d, x[k + 1], S31, 2763975236); d = HH(d, a, b, c, x[k + 4], S32, 1272893353); c = HH(c, d, a, b, x[k + 7], S33, 4139469664); b = HH(b, c, d, a, x[k + 10], S34, 3200236656); a = HH(a, b, c, d, x[k + 13], S31, 681279174); d = HH(d, a, b, c, x[k + 0], S32, 3936430074); c = HH(c, d, a, b, x[k + 3], S33, 3572445317); b = HH(b, c, d, a, x[k + 6], S34, 76029189); a = HH(a, b, c, d, x[k + 9], S31, 3654602809); d = HH(d, a, b, c, x[k + 12], S32, 3873151461); c = HH(c, d, a, b, x[k + 15], S33, 530742520); b = HH(b, c, d, a, x[k + 2], S34, 3299628645); a = II(a, b, c, d, x[k + 0], S41, 4096336452); d = II(d, a, b, c, x[k + 7], S42, 1126891415); c = II(c, d, a, b, x[k + 14], S43, 2878612391); b = II(b, c, d, a, x[k + 5], S44, 4237533241); a = II(a, b, c, d, x[k + 12], S41, 1700485571); d = II(d, a, b, c, x[k + 3], S42, 2399980690); c = II(c, d, a, b, x[k + 10], S43, 4293915773); b = II(b, c, d, a, x[k + 1], S44, 2240044497); a = II(a, b, c, d, x[k + 8], S41, 1873313359); d = II(d, a, b, c, x[k + 15], S42, 4264355552); c = II(c, d, a, b, x[k + 6], S43, 2734768916); b = II(b, c, d, a, x[k + 13], S44, 1309151649); a = II(a, b, c, d, x[k + 4], S41, 4149444226); d = II(d, a, b, c, x[k + 11], S42, 3174756917); c = II(c, d, a, b, x[k + 2], S43, 718787259); b = II(b, c, d, a, x[k + 9], S44, 3951481745); a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD) } var tempValue = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d); return tempValue.toLowerCase() }; var rotateLeft = function (lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)) }; var addUnsigned = function (lX, lY) { var lX4, lY4, lX8, lY8, lResult; lX8 = (lX & 2147483648); lY8 = (lY & 2147483648); lX4 = (lX & 1073741824); lY4 = (lY & 1073741824); lResult = (lX & 1073741823) + (lY & 1073741823); if (lX4 & lY4) { return (lResult ^ 2147483648 ^ lX8 ^ lY8) } if (lX4 | lY4) { if (lResult & 1073741824) { return (lResult ^ 3221225472 ^ lX8 ^ lY8) } else { return (lResult ^ 1073741824 ^ lX8 ^ lY8) } } else { return (lResult ^ lX8 ^ lY8) } }; var F = function (x, y, z) { return (x & y) | ((~x) & z) }; var G = function (x, y, z) { return (x & z) | (y & (~z)) }; var H = function (x, y, z) { return (x ^ y ^ z) }; var I = function (x, y, z) { return (y ^ (x | (~z))) }; var FF = function (a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b) }; var GG = function (a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b) }; var HH = function (a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b) }; var II = function (a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b) }; var convertToWordArray = function (string) { var lWordCount; var lMessageLength = string.length; var lNumberOfWordsTempOne = lMessageLength + 8; var lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - (lNumberOfWordsTempOne % 64)) / 64; var lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16; var lWordArray = Array(lNumberOfWords - 1); var lBytePosition = 0; var lByteCount = 0; while (lByteCount < lMessageLength) { lWordCount = (lByteCount - (lByteCount % 4)) / 4; lBytePosition = (lByteCount % 4) * 8; lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition)); lByteCount++ } lWordCount = (lByteCount - (lByteCount % 4)) / 4; lBytePosition = (lByteCount % 4) * 8; lWordArray[lWordCount] = lWordArray[lWordCount] | (128 << lBytePosition); lWordArray[lNumberOfWords - 2] = lMessageLength << 3; lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29; return lWordArray }; var wordToHex = function (lValue) {
    var WordToHexValue = "", WordToHexValueTemp = "", lByte, lCount; for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255; WordToHexValueTemp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2)
    } return WordToHexValue
  }; var uTF8Encode = function (string) { string = string.toString().replace(/\x0d\x0a/g, "\x0a"); var output = ""; for (var n = 0; n < string.length; n++) { var c = string.charCodeAt(n); if (c < 128) { output += String.fromCharCode(c) } else { if ((c > 127) && (c < 2048)) { output += String.fromCharCode((c >> 6) | 192); output += String.fromCharCode((c & 63) | 128) } else { output += String.fromCharCode((c >> 12) | 224); output += String.fromCharCode(((c >> 6) & 63) | 128); output += String.fromCharCode((c & 63) | 128) } } } return output }; return createMD5String(md5str)
};
