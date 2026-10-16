/*
new Env('极核-ZEEHO');
@Author: Leiyiyan
@Date: 2026-10-16 20:42

@Description:
极核 每日签到、积分任务

获取 Cookie 方式：zeeho app - 我的

图标: https://raw.githubusercontent.com/leiyiyan/resource/main/icons/zeeho.png

Boxjs订阅: https://raw.githubusercontent.com/leiyiyan/resource/main/subscribe/leiyiyan.boxjs.json


[Script]
# 获取 Cookie
http-response ^https:\/\/tapi\.zeehoev\.com\/v1\.0\/mine\/cfmotoservermine\/setting script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/zeeho/zeeho.js, requires-body=true, timeout=60, tag=极核Cookie

# 脚本任务
cron "0 7 * * *" script-path=https://raw.githubusercontent.com/leiyiyan/resource/main/script/zeeho/zeeho.js, tag=极核

[MITM]
hostname = tapi.zeehoev.com

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

// env.js 全局
const $ = new Env("极核-ZEEHO");
const ckName = "zeeho_data";
//-------------------- 一般不动变量区域 -------------------------------------
const Notify = 1;//0为关闭通知,1为打开通知,默认为1
// 无补签卡时，是否自动用 100 积分兑换一张补签卡（true=自动兑换，false=只补已有卡）
const autoExchangeSupplementCard = true;
const notify = $.isNode() ? require('./sendNotify') : '';
let envSplitor = ["@"]; //多账号分隔符
var userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
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
//脚本入口函数main()
async function main() {
  try {
    $.log('\n================== 任务 ==================\n');
    for (let user of userList) {
      console.log(`🔷账号${user.index} >> Start work`)
      console.log(`随机延迟${user.getRandomTime()}ms`);
      // 签到
      const integral = await user.signin();
      let integralScore = 0
      if (user.ckStatus) {
        await $.wait(user.getRandomTime());
        // 查看签到记录
        const {
  count = 0,
  prize = 0,
  prizes = 0
} = await user.getSignRecord() || {}

await $.wait(user.getRandomTime());

if(prizes >= 30) {

  // 盲盒抽奖
  integralScore = await user.lottery()

  await $.wait(user.getRandomTime());

}

        // 补签：把本月漏签的日期用补签卡补上（无卡时按需用100积分兑换）
        const missedDays = await user.getMissedDays()
        if (missedDays.length) {
          $.log(`ℹ️ 检测到本月漏签 ${missedDays.length} 天: ${missedDays.join(', ')}`)
          let cards = await user.getSupplementCount()
          for (const day of missedDays) {
            if (cards <= 0) {
              if (!autoExchangeSupplementCard) {
                $.log(`⚠️ 无补签卡，已跳过补签（autoExchangeSupplementCard=false）`)
                break
              }
              const ok = await user.exchangeSupplementCard()
              if (!ok) break
              await $.wait(user.getRandomTime())
              cards = await user.getSupplementCount()
              if (cards <= 0) break
            }
            await $.wait(user.getRandomTime())
            const done = await user.supplement(day)
            if (done) cards--
            else break
          }
        }

        // 创建动态
        let postId = await user.createArticle()
        await $.wait(user.getRandomTime());
        // 获取动态列表
        postId = postId || await user.getArticles()
        if (postId) {
          await $.wait(user.getRandomTime());
          // 点赞
          await user.thumbsUp(postId)
          await $.wait(user.getRandomTime());
          // 评论
          await user.comment(postId)
          await $.wait(user.getRandomTime());
          // 分享
          await user.share(postId)
          await $.wait(user.getRandomTime());
          // 删除动态
          await user.deletePost(postId)
          await $.wait(user.getRandomTime());
        } else {
          $.log(`⛔️ 未获取到动态ID，跳过互动任务`);
        }
        //查询待领取积分
        const score = await user.getSignInfo();
        $.title = `本次运行共获得${(integral + integralScore + 3)}积分`;
        DoubleLog(`「${user.userName}」当前积分:${score}分,累计签到:${count}天`);
      } else {
        //将ck过期消息存入消息数组
        $.notifyMsg.push(`❌账号${user.userName || user.index} >> Check ck error!`)
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
    this.userAgent = user.userAgent;
    this.ckStatus = true;
    //请求封装
    this.baseUrl = ``;
    this.host = "";
    this.headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "Accept-Language": "zh-CN",
      "Authorization": this.token,
      "User-Agent": this.userAgent,
      "user_id": this.userId,
      "interfaceversion": "2",
    }
    this.getRandomTime = () => randomInt(1e3, 3e3);
    this.fetch = async (o) => {
      try {
        if (typeof o === 'string') o = { url: o };
        if (o?.url?.startsWith("/")) o.url = this.host + o.url
        const res = await Request({ ...o, headers: o.headers || this.headers, url: o.url || this.baseUrl })
        debug(res, o?.url?.replace(/\/+$/, '').substring(o?.url?.lastIndexOf('/') + 1));
        if (res?.code == 40001) throw new Error(res?.message || `用户需要去登录`);
        return res;
      } catch (e) {
        this.ckStatus = false;
        $.log(`⛔️ 请求发起失败！${e}`);
      }
    }
  }
  //签到（2026-08-28 起签到接口迁移到 h5.zeehoev.com/cfmotoservermine/H5/signin）
  async signin() {
    try {
      const today = todayStr()
      const month = today.slice(0, 7)
      const infoOpts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signin/info",
        type: "get",
        headers: Object.assign({}, this.headers, getSign('h5', { month })),
        params: { month },
        dataType: "json"
      }
      // 1) 先查今日是否已签
      const info = await this.fetch(infoOpts)
      const todayEntry = (info?.data?.nowSignDetailVos || []).find(x => x.createDate === today)
      if (todayEntry && (todayEntry.signStatue === 3 || todayEntry.signStatue === 5)) {
        $.log(`✅ 签到任务: 今日已签到`)
        return null
      }
      // 2) 执行签到：无参、空 body '{}'（与 H5 端一致）
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signin",
        type: "post",
        headers: Object.assign({}, this.headers, getSign('h5', {}, '{}')),
        body: {},
        dataType: "json"
      }
      let res = await this.fetch(opts);
      if (res?.code == '10000' && res?.message == '操作成功') {
        // 3) 回查今日积分
        const info2 = await this.fetch(infoOpts)
        const te = (info2?.data?.nowSignDetailVos || []).find(x => x.createDate === today)
        const point = te?.integralScore ? Number(te.integralScore) : 0
        $.log(point > 0 ? `✅ 签到任务: 签到成功 +${point}积分` : `✅ 签到任务: 今日已签到`)
        return point
      } else {
        $.log(`⛔️ 签到任务: ${res?.message}`);
        return null
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 签到失败! ${e}`);
    }
  }
    // 查询签到记录


  async getSignRecord() {

  try {

    const params = {
      month: monthStr()
    };

    const opts = {
      url: "https://h5.zeehoev.com/cfmotoservermine/H5/signin/info",
      type: "get",
      headers: Object.assign({}, this.headers, getSign('h5', params)),
      params,
      dataType: "json"
    };

    let res = await this.fetch(opts);

    if (res?.code == '10000' && res?.message == '操作成功') {

      const list = res?.data?.nowSignDetailVos || [];

      // 连续签到天数：优先用接口直出的 signCount，没有再从明细回算
      let count = Number(res?.data?.signCount) || 0;

      if (!count && list.length) {
        // 今日日期（本地时区，原版 toISOString 是 UTC，会错一天）
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        // 找到今天索引，找不到就取最新一天
        let startIndex = list.findIndex(
          item => String(item.createDate || '').slice(0, 10) === today
        );
        if (startIndex < 0) startIndex = list.length - 1;

        // 从今天开始往前统计
        for (let i = startIndex; i >= 0; i--) {

          const status = list[i]?.signStatue;

          // 3=已签到 5=补签
          if (status == 3 || status == 5) {
            count++;
          } else {
            break;
          }
        }
      }

      // 今日积分
      const prize = res?.data?.integral || 0;

      // 连签累计奖励次数
      const prizes = res?.data?.prizes || 0;

      $.log(
        `✅ 连续签到${count}天 | 今日积分${prize} | 连签奖励累计${prizes}`
      );

      return {
        count,
        prize,
        prizes
      };

    }

    return null;

  } catch (e) {

    this.ckStatus = false;
    $.log(`⛔️ 查询签到记录失败! ${e}`);

  }

}
    // 开启盲盒


  async lottery() {
    try {
      const params = {
        boxType: 0,
        version: 'v2'
      }
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signin/lottery",
        type: "get",
        headers: Object.assign({}, this.headers, getSign('h5', params)),
        params,
        dataType: "json"
      }
      let res = await this.fetch(opts);
      if (res?.code == '10000') {

        const bd = (res?.data && res.data.signPrizesVO) || res?.data || {};
        const integralScore = bd.integral || bd.integralScore || res?.data?.integral || 0;
        const prizesName = bd.prizesName || (integralScore + '积分');
        $.log(`✅ 盲盒抽奖获得: ${prizesName}`);
        return Number(integralScore);
      } else {
        $.log(`⚠️ 盲盒抽奖(今日可能无盲盒): ${res?.message}`);
        return 0;
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 盲盒抽奖发起失败! ${e}`);
      return 0;
    }
  }

  // 补签卡数量（POST，空 body {}）
  async getSupplementCount() {
    try {
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signInSupplement/count",
        type: "post",
        headers: Object.assign({}, this.headers, getSign('h5', {}, '{}')),
        body: {},
        dataType: "json"
      }
      const res = await this.fetch(opts)
      if (res?.code == '10000') return Number(res.data) || 0
      return 0
    } catch (e) {
      $.log(`⛔️ 查询补签卡失败! ${e}`)
      return 0
    }
  }

  // 用 100 积分兑换一张补签卡
  async exchangeSupplementCard() {
    try {
      const params = { sourceType: 1 }
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signInSupplement/gain",
        type: "get",
        headers: Object.assign({}, this.headers, getSign('h5', params)),
        params,
        dataType: "json"
      }
      const res = await this.fetch(opts)
      if (res?.code == '10000') {
        $.log(`✅ 兑换补签卡: 成功（消耗100积分，有效期至 ${res.data}）`)
        return true
      }
      $.log(`⚠️ 兑换补签卡失败: ${res?.message}`)
      return false
    } catch (e) {
      $.log(`⛔️ 兑换补签卡失败! ${e}`)
      return false
    }
  }

  // 使用补签卡补签指定日期
  async supplement(dateTime) {
    try {
      const params = { dateTime }
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signInSupplement/consume",
        type: "get",
        headers: Object.assign({}, this.headers, getSign('h5', params)),
        params,
        dataType: "json"
      }
      const res = await this.fetch(opts)
      if (res?.code == '10000') {
        $.log(`✅ 补签 ${dateTime}: 成功`)
        return true
      }
      $.log(`⚠️ 补签 ${dateTime} 失败: ${res?.message}`)
      return false
    } catch (e) {
      $.log(`⛔️ 补签 ${dateTime} 失败! ${e}`)
      return false
    }
  }

  // 本月漏签日期（signStatue=4 且早于今天）
  async getMissedDays() {
    try {
      const today = todayStr()
      const params = { month: today.slice(0, 7) }
      const opts = {
        url: "https://h5.zeehoev.com/cfmotoservermine/H5/signin/info",
        type: "get",
        headers: Object.assign({}, this.headers, getSign('h5', params)),
        params,
        dataType: "json"
      }
      const res = await this.fetch(opts)
      if (res?.code != '10000') return []
      return (res?.data?.nowSignDetailVos || [])
        .filter(x => x.signStatue === 4 && x.createDate < today)
        .map(x => x.createDate)
        .sort((a, b) => b.localeCompare(a)) // 最新日期优先补
    } catch (e) {
      $.log(`⛔️ 查询漏签日期失败! ${e}`)
      return []
    }
  }

  // 创建动态
  async createArticle() {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/commonArticle`,
        type: "post",
        dataType: "json",
        headers: Object.assign({}, this.headers, getSign('app')),
        body: {
          postcontent: "开心的一天"
        }
      }
      let res = await this.fetch(opts);
      if (res?.code == '10000') {
        const postId = getPostId(res?.data);
        $.log(`\u2705 \u521b\u5efa\u52a8\u6001: \u6210\u529f${postId ? ` ${postId}` : ''}`);
        return postId;
      } else {
        $.log(`\u26d4\ufe0f \u521b\u5efa\u52a8\u6001\u5931\u8d25: ${res?.message}`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 创建动态失败! ${e}`);
    }
  }
  // 获取动态列表
  async getArticles() {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/community/mineArticleInfo`,
        type: "get",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json",
        params: {
          userId: this.userId,
          page: 1,
          pageSize: 10
        }
      }
      let res = null
      // 40000「网络开小差了」多为限流/瞬时抖动，重试 3 次
      for (let i = 1; i <= 3; i++) {
        res = await this.fetch(opts)
        if (res?.code == '10000') break
        $.log(`⚠️ 获取动态失败(${i}/3): ${res?.message || '无响应'}`)
        if (i < 3) await $.wait(1500 * i)
      }
      if (res?.code == '10000') {
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.records || res?.data?.list || res?.data?.rows || [])
        let postId = getPostId(list?.[0] || res?.data)
        if (!postId) postId = await this.getCommunityArticle()
        $.log(`\u2705 \u83b7\u53d6\u52a8\u6001: ${postId}`);
        return postId
      }
      // 兜底：从社区列表里找自己的动态
      const fallback = await this.getCommunityArticle()
      if (fallback) {
        $.log(`\u2705 \u83b7\u53d6\u52a8\u6001(\u515c\u5e95): ${fallback}`);
        return fallback
      }
      $.log(`\u26d4\ufe0f \u83b7\u53d6\u52a8\u6001\u5931\u8d25: ${res?.message}`);
      return null
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 获取动态列表失败! ${e}`);
    }
  }
  async getCommunityArticle() {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/community/qbTzInfoNewV2`,
        type: "get",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json",
        params: {
          page: 1,
          pageSize: 20,
          postModule: 2,
          slidingType: 1
        }
      }
      const res = await this.fetch(opts);
      if (res?.code == '10000') {
        const list = Array.isArray(res?.data) ? res.data : [];
        const mine = list.find(item => String(item.userId || item.createBy || item.uid || '') === String(this.userId));
        return getPostId(mine || list[0]);
      }
      return null;
    } catch (e) {
      $.log(`\u26d4\ufe0f \u83b7\u53d6\u793e\u533a\u52a8\u6001\u5931\u8d25: ${e}`);
      return null;
    }
  }

  // 点赞动态
  async thumbsUp(postId) {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/socialCommu/likeFavoriteInfo`,
        type: "post",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json",
        body: {
          postId: String(postId),
          kindFlag:"0"
        }
      }
      const res = await this.fetch(opts);
      if (res?.code == '10000') {
        $.log(`\u2705 \u70b9\u8d5e\u52a8\u6001: ${postId}`)
      } else {
        $.log(`\u26d4\ufe0f \u70b9\u8d5e\u52a8\u6001\u5931\u8d25: ${res?.message}`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 点赞动态失败! ${e}`);
    }
  }
  // ????
  async share(postId) {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/article/share/${postId}`,
        type: "put",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json"
      }
      let res = await this.fetch(opts);
      if (res?.code == '10000') {
        $.log(`\u2705 \u5206\u4eab\u52a8\u6001: ${postId}`)
      } else {
        $.log(`\u26d4\ufe0f \u5206\u4eab\u52a8\u6001\u5931\u8d25: ${res?.message}`);
      }
      await this.adjustByShare();
    } catch (e) {
      this.ckStatus = false;
      $.log(`\u26d4\ufe0f \u5206\u4eab\u52a8\u6001\u5931\u8d25: ${e}`);
    }
  }
  // ????
  async adjustByShare() {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/mine/cfmotoservermine/integral/adjustByShare`,
        type: "get",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json"
      }
      const res = await this.fetch(opts);
      if (res?.code == '10000') {
        $.log(`\u2705 \u5206\u4eab\u79ef\u5206: \u5df2\u89e6\u53d1`)
      } else {
        $.log(`\u26d4\ufe0f \u5206\u4eab\u79ef\u5206\u5931\u8d25: ${res?.message}`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`\u26d4\ufe0f \u5206\u4eab\u79ef\u5206\u5931\u8d25: ${e}`);
    }
  }
  // ????
  async comment(postId) {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/commentInfo`,
        type: "post",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json",
        body: {
          postid: String(postId),
          userId: String(this.userId),
          comments: "\u5389\u5bb3",
          sendTos: "[\n\n]"
        }
      }
      const res = await this.fetch(opts);
      if (res?.code == '10000') {
        $.log(`\u2705 \u8bc4\u8bba\u52a8\u6001: ${postId}`)
      } else {
        $.log(`\u26d4\ufe0f \u8bc4\u8bba\u52a8\u6001\u5931\u8d25: ${res?.message}`);
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`\u26d4\ufe0f \u8bc4\u8bba\u52a8\u6001\u5931\u8d25: ${e}`);
    }
  }
  // 删除动态
  async deletePost(postId) {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/social/cfmotoserversocial/commonArticle/deleteArticle?articleId=${postId}&postType=1`,
        type: "delete",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json"
      }
      const res = await this.fetch(opts);
      if (res?.code == '10000') {
        $.log(`\u2705 \u5220\u9664\u52a8\u6001: ${postId}`)
      } else {
        $.log(`\u26d4\ufe0f \u5220\u9664\u52a8\u6001\u5931\u8d25: ${res?.message}`)
      }
    } catch (e) {
      this.ckStatus = false;
      $.log(`\u26d4\ufe0f \u5220\u9664\u52a8\u6001\u5931\u8d25: ${e}`);
    }
  }
  
  // 查询用户信息
  async getSignInfo() {
    try {
      const opts = {
        url: `https://tapi.zeehoev.com/v1.0/mine/cfmotoservermine/setting/${this.userId}`,
        type: "get",
        headers: Object.assign({}, this.headers, getSign('app')),
        dataType: "json"
      }
      let res = await this.fetch(opts);
      if (res?.code == '10000' && res?.message == '操作成功') {
        const score = res?.data?.score
        return score
      }
      return null
    } catch (e) {
      this.ckStatus = false;
      $.log(`⛔️ 查询用户信息失败! ${e}`);
    }
  }
}
function getPostId(data) {
  if (!data) return null;
  if (typeof data === 'string' || typeof data === 'number') return String(data);
  if (Array.isArray(data)) return getPostId(data[0]);
  const direct = data.uuid || data.tuuid || data.postId || data.postid || data.articleId || data.articleID || data.id || data.dataId || data.tid;
  if (direct) return String(direct);
  for (const key of ['records', 'list', 'rows', 'data', 'result']) {
    const value = data[key];
    const postId = getPostId(value);
    if (postId) return postId;
  }
  return null;
}
async function getCookie() {
  if ($request && $request.method === 'OPTIONS') return;

  const header = ObjectKeys2LowerCase($request.headers);
  const token = header['authorization'];
  const userAgent = header['user-agent'];
  const body = $.toObj($response.body);
  if (!(body?.data)) {
    $.msg($.name, `❌获取Cookie失败!`, "")
    return;
  }

  const { id, nickName } = body?.data;
  const newData = {
    "userId": id,
    "token": token,
    "userName": nickName,
    "userAgent": userAgent
  }

  userCookie = userCookie ? JSON.parse(userCookie) : [];
  const index = userCookie.findIndex(e => e.userId == newData.userId);

  userCookie[index] ? userCookie[index] = newData : userCookie.push(newData);

  $.setjson(userCookie, ckName);
  $.msg($.name, `🎉${newData.userName}更新token成功!`, ``);
}
function getSign(type, params = {}, body = '') {
  // 2026-08-28 起 H5 端 appId/appSecret 轮换：AiTXmBrm / 70c2...
  // 旧值 oWo6ZdTg / a03b... 会被服务端拒绝（430 permit error）
  const appConfig = {
    appId: type === "h5" ? "AiTXmBrm" : "S7qPWPU1",
    appSecret: type === "h5" ? "70c2c7458ab88ca9504ad0521f170075bc91f2f7" : "c5e0da7f4da28df805694ec3dd1fc6792e9df99d"
  }
  const query = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
  const timestamp = new Date().getTime()
  const nonce = type === "h5" ? getUuid() : timestamp + getRandomChars()
  const param = `appId=${appConfig.appId}&nonce=${nonce}&timestamp=${timestamp}`
  const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : ''
  // h5 签名必须带上 bodyStr（签到为空 body '{}'），否则 430 permit error
  const signature = type === "h5" ? `${query}${bodyStr}${param}${appConfig.appSecret}` : `${bodyStr}${param}${appConfig.appSecret}`
  const sign = md5(sha1(signature), 32).toString()
  return {
    'cfmoto-x-param': param,
    'cfmoto-x-sign': sign,
    'cfmoto-x-sign-type': '0',
    'timestamp': String(timestamp),
    'nonce': nonce,
    'signature': sign
  }
}
//-------------------------- 辅助函数区域 -----------------------------------
//请求二次封装
async function Request(o) {
  if (typeof o === 'string') o = { url: o };
  try {
    if (!o?.url) throw new Error('[发送请求] 缺少 url 参数');
    // type => 因为env中使用method处理post的特殊请求(put/delete/patch), 所以这里使用type
    let { url: u, type, headers = {}, body: b, params, dataType = 'form', resultType = 'data' } = o;
    // post请求需要处理params参数(get不需要, env已经处理)
    const method = type ? type?.toLowerCase() : ('body' in o ? 'post' : 'get');
    const query = params ? $.queryStr(params) : '';
    const urlQuery = u.includes('?') ? u.split('?').slice(1).join('?') : '';
    const signQuery = [urlQuery, query].filter(Boolean).join('&');
    const url = u.concat(query ? (u.includes('?') ? '&' : '?') + query : '');

    const timeout = o.timeout ? ($.isSurge() ? o.timeout / 1e3 : o.timeout) : 1e4
    // 根据jsonType处理headers
    if (dataType === 'json') headers['Content-Type'] = 'application/json;charset=UTF-8';
    // post请求处理body
    const body = b && dataType == 'form' ? $.queryStr(b) : $.toStr(b);
    if (headers['cfmoto-x-param'] && headers['cfmoto-x-param'].includes('appId=S7qPWPU1')) {
      const signPayload = body || signQuery;
      if (signPayload) {
        const signature = `${signPayload}${headers['cfmoto-x-param']}c5e0da7f4da28df805694ec3dd1fc6792e9df99d`;
        const sign = md5(sha1(signature), 32).toString();
        headers['cfmoto-x-sign'] = sign;
        headers['signature'] = sign;
      }
    }
    const httpMethod = ['get', 'post'].includes(method) ? method : 'post';
    const request = { ...o, ...(o?.opts ? o.opts : {}), url, method, headers, params: undefined, ...(method !== 'get' && body && { body }), timeout: timeout }
    const httpPromise = $.http[httpMethod.toLowerCase()](request)
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
//本地日期 YYYY-MM-DD（避免 toISOString 的 UTC 偏移）
function todayStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
};
//本月 YYYY-MM（月份补零）
function monthStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
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
  const msg = [
    ...(l || []).map(u => u?.message?.join('\n')).filter(Boolean),
    ...($.notifyMsg || []).filter(Boolean)
  ].join('\n');
  await SendMsg(msg);
};
//账号通知
async function SendMsg(n, o) {
  n && (0 < Notify ? $.isNode() ? await notify.sendNotify($.name, n) : $.msg($.name, $.title || "", n, {
    "media-url": o
  }) : console.log(n))
};
//将请求头转换为小写
function ObjectKeys2LowerCase(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])) }
//---------------------- 主程序执行入口 -----------------------------------
!(async () => {
  if (typeof $request != "undefined") {
    await getCookie();
  } else {
    const e = envSplitor.find(o => userCookie.includes(o)) || envSplitor[0];
    userCookie = $.toObj(userCookie) || userCookie.split(e);

    userList.push(...userCookie.map(n => new UserInfo(n)).filter(Boolean));

    userCount = userList.length;
    console.log(`共找到${userCount}个账号`);
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
function randomPattern(pattern,chars="abcdef0123456789"){let result="";for(let char of pattern){if(char==="x"){result+=chars.charAt(Math.floor(Math.random()*chars.length))}else if(char==="X"){result+=chars.charAt(Math.floor(Math.random()*chars.length)).toUpperCase()}else{result+=char}}return result}
function getUuid(){const uuid=[randomPattern("xxxxxxxx"),randomPattern("xxxx"),randomPattern("4xxx"),randomPattern("xxxx"),randomPattern("xxxxxxxxxxxx")];return uuid.join("-")}
function getRandomChars(n=16){const chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';let result='';for(let i=0;i<n;i++){result+=chars.charAt(Math.floor(Math.random()*chars.length))}return result}
function md5(t,e){function n(t,e){return t<<e|t>>>32-e}function r(t,e){var n,r,o,i,a;return o=2147483648&t,i=2147483648&e,a=(1073741823&t)+(1073741823&e),(n=1073741824&t)&(r=1073741824&e)?2147483648^a^o^i:n|r?1073741824&a?3221225472^a^o^i:1073741824^a^o^i:a^o^i}function o(t,e,o,i,a,u,c){return t=r(t,r(r(function(t,e,n){return t&e|~t&n}(e,o,i),a),c)),r(n(t,u),e)}function i(t,e,o,i,a,u,c){return t=r(t,r(r(function(t,e,n){return t&n|e&~n}(e,o,i),a),c)),r(n(t,u),e)}function a(t,e,o,i,a,u,c){return t=r(t,r(r(function(t,e,n){return t^e^n}(e,o,i),a),c)),r(n(t,u),e)}function u(t,e,o,i,a,u,c){return t=r(t,r(r(function(t,e,n){return e^(t|~n)}(e,o,i),a),c)),r(n(t,u),e)}function c(t){var e,n="",r="";for(e=0;e<=3;e++)n+=(r="0"+(t>>>8*e&255).toString(16)).substr(r.length-2,2);return n}var s,l,f,p,d,h,v,y,g,m=Array();for(m=function(t){for(var e,n=t.length,r=n+8,o=16*((r-r%64)/64+1),i=Array(o-1),a=0,u=0;u<n;)a=u%4*8,i[e=(u-u%4)/4]=i[e]|t.charCodeAt(u)<<a,u++;return a=u%4*8,i[e=(u-u%4)/4]=i[e]|128<<a,i[o-2]=n<<3,i[o-1]=n>>>29,i}(t=function(t){t=t.replace(/\r\n/g,"\n");for(var e="",n=0;n<t.length;n++){var r=t.charCodeAt(n);r<128?e+=String.fromCharCode(r):r>127&&r<2048?(e+=String.fromCharCode(r>>6|192),e+=String.fromCharCode(63&r|128)):(e+=String.fromCharCode(r>>12|224),e+=String.fromCharCode(r>>6&63|128),e+=String.fromCharCode(63&r|128))}return e}(t)),h=1732584193,v=4023233417,y=2562383102,g=271733878,s=0;s<m.length;s+=16)l=h,f=v,p=y,d=g,h=o(h,v,y,g,m[s+0],7,3614090360),g=o(g,h,v,y,m[s+1],12,3905402710),y=o(y,g,h,v,m[s+2],17,606105819),v=o(v,y,g,h,m[s+3],22,3250441966),h=o(h,v,y,g,m[s+4],7,4118548399),g=o(g,h,v,y,m[s+5],12,1200080426),y=o(y,g,h,v,m[s+6],17,2821735955),v=o(v,y,g,h,m[s+7],22,4249261313),h=o(h,v,y,g,m[s+8],7,1770035416),g=o(g,h,v,y,m[s+9],12,2336552879),y=o(y,g,h,v,m[s+10],17,4294925233),v=o(v,y,g,h,m[s+11],22,2304563134),h=o(h,v,y,g,m[s+12],7,1804603682),g=o(g,h,v,y,m[s+13],12,4254626195),y=o(y,g,h,v,m[s+14],17,2792965006),h=i(h,v=o(v,y,g,h,m[s+15],22,1236535329),y,g,m[s+1],5,4129170786),g=i(g,h,v,y,m[s+6],9,3225465664),y=i(y,g,h,v,m[s+11],14,643717713),v=i(v,y,g,h,m[s+0],20,3921069994),h=i(h,v,y,g,m[s+5],5,3593408605),g=i(g,h,v,y,m[s+10],9,38016083),y=i(y,g,h,v,m[s+15],14,3634488961),v=i(v,y,g,h,m[s+4],20,3889429448),h=i(h,v,y,g,m[s+9],5,568446438),g=i(g,h,v,y,m[s+14],9,3275163606),y=i(y,g,h,v,m[s+3],14,4107603335),v=i(v,y,g,h,m[s+8],20,1163531501),h=i(h,v,y,g,m[s+13],5,2850285829),g=i(g,h,v,y,m[s+2],9,4243563512),y=i(y,g,h,v,m[s+7],14,1735328473),h=a(h,v=i(v,y,g,h,m[s+12],20,2368359562),y,g,m[s+5],4,4294588738),g=a(g,h,v,y,m[s+8],11,2272392833),y=a(y,g,h,v,m[s+11],16,1839030562),v=a(v,y,g,h,m[s+14],23,4259657740),h=a(h,v,y,g,m[s+1],4,2763975236),g=a(g,h,v,y,m[s+4],11,1272893353),y=a(y,g,h,v,m[s+7],16,4139469664),v=a(v,y,g,h,m[s+10],23,3200236656),h=a(h,v,y,g,m[s+13],4,681279174),g=a(g,h,v,y,m[s+0],11,3936430074),y=a(y,g,h,v,m[s+3],16,3572445317),v=a(v,y,g,h,m[s+6],23,76029189),h=a(h,v,y,g,m[s+9],4,3654602809),g=a(g,h,v,y,m[s+12],11,3873151461),y=a(y,g,h,v,m[s+15],16,530742520),h=u(h,v=a(v,y,g,h,m[s+2],23,3299628645),y,g,m[s+0],6,4096336452),g=u(g,h,v,y,m[s+7],10,1126891415),y=u(y,g,h,v,m[s+14],15,2878612391),v=u(v,y,g,h,m[s+5],21,4237533241),h=u(h,v,y,g,m[s+12],6,1700485571),g=u(g,h,v,y,m[s+3],10,2399980690),y=u(y,g,h,v,m[s+10],15,4293915773),v=u(v,y,g,h,m[s+1],21,2240044497),h=u(h,v,y,g,m[s+8],6,1873313359),g=u(g,h,v,y,m[s+15],10,4264355552),y=u(y,g,h,v,m[s+6],15,2734768916),v=u(v,y,g,h,m[s+13],21,1309151649),h=u(h,v,y,g,m[s+4],6,4149444226),g=u(g,h,v,y,m[s+11],10,3174756917),y=u(y,g,h,v,m[s+2],15,718787259),v=u(v,y,g,h,m[s+9],21,3951481745),h=r(h,l),v=r(v,f),y=r(y,p),g=r(g,d);return 32==e?(c(h)+c(v)+c(y)+c(g)).toLowerCase():(c(v)+c(y)).toLowerCase()}
function sha1(msg){function rotate_left(n,s){var t4=(n<<s)|(n>>>(32-s));return t4};function lsb_hex(val){var str='';var i;var vh;var vl;for(i=0;i<=6;i+=2){vh=(val>>>(i*4+4))&0x0f;vl=(val>>>(i*4))&0x0f;str+=vh.toString(16)+vl.toString(16)}return str};function cvt_hex(val){var str='';var i;var v;for(i=7;i>=0;i--){v=(val>>>(i*4))&0x0f;str+=v.toString(16)}return str};function Utf8Encode(string){string=string.replace(/\r\n/g,'\n');var utftext='';for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);if(c<128){utftext+=String.fromCharCode(c)}else if((c>127)&&(c<2048)){utftext+=String.fromCharCode((c>>6)|192);utftext+=String.fromCharCode((c&63)|128)}else{utftext+=String.fromCharCode((c>>12)|224);utftext+=String.fromCharCode(((c>>6)&63)|128);utftext+=String.fromCharCode((c&63)|128)}}return utftext};var blockstart;var i,j;var W=new Array(80);var H0=0x67452301;var H1=0xEFCDAB89;var H2=0x98BADCFE;var H3=0x10325476;var H4=0xC3D2E1F0;var A,B,C,D,E;var temp;msg=Utf8Encode(msg);var msg_len=msg.length;var word_array=new Array();for(i=0;i<msg_len-3;i+=4){j=msg.charCodeAt(i)<<24|msg.charCodeAt(i+1)<<16|msg.charCodeAt(i+2)<<8|msg.charCodeAt(i+3);word_array.push(j)}switch(msg_len%4){case 0:i=0x080000000;break;case 1:i=msg.charCodeAt(msg_len-1)<<24|0x0800000;break;case 2:i=msg.charCodeAt(msg_len-2)<<24|msg.charCodeAt(msg_len-1)<<16|0x08000;break;case 3:i=msg.charCodeAt(msg_len-3)<<24|msg.charCodeAt(msg_len-2)<<16|msg.charCodeAt(msg_len-1)<<8|0x80;break}word_array.push(i);while((word_array.length%16)!=14)word_array.push(0);word_array.push(msg_len>>>29);word_array.push((msg_len<<3)&0x0ffffffff);for(blockstart=0;blockstart<word_array.length;blockstart+=16){for(i=0;i<16;i++)W[i]=word_array[blockstart+i];for(i=16;i<=79;i++)W[i]=rotate_left(W[i-3]^W[i-8]^W[i-14]^W[i-16],1);A=H0;B=H1;C=H2;D=H3;E=H4;for(i=0;i<=19;i++){temp=(rotate_left(A,5)+((B&C)|(~B&D))+E+W[i]+0x5A827999)&0x0ffffffff;E=D;D=C;C=rotate_left(B,30);B=A;A=temp}for(i=20;i<=39;i++){temp=(rotate_left(A,5)+(B^C^D)+E+W[i]+0x6ED9EBA1)&0x0ffffffff;E=D;D=C;C=rotate_left(B,30);B=A;A=temp}for(i=40;i<=59;i++){temp=(rotate_left(A,5)+((B&C)|(B&D)|(C&D))+E+W[i]+0x8F1BBCDC)&0x0ffffffff;E=D;D=C;C=rotate_left(B,30);B=A;A=temp}for(i=60;i<=79;i++){temp=(rotate_left(A,5)+(B^C^D)+E+W[i]+0xCA62C1D6)&0x0ffffffff;E=D;D=C;C=rotate_left(B,30);B=A;A=temp}H0=(H0+A)&0x0ffffffff;H1=(H1+B)&0x0ffffffff;H2=(H2+C)&0x0ffffffff;H3=(H3+D)&0x0ffffffff;H4=(H4+E)&0x0ffffffff}var temp=cvt_hex(H0)+cvt_hex(H1)+cvt_hex(H2)+cvt_hex(H3)+cvt_hex(H4);return temp.toLowerCase()}
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, r) => { s.call(this, t, ((t, s, a) => { t ? r(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, r) => e(r))) })) } runScript(t, e) { return new Promise((s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, ((t, e, r) => s(r))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s = void 0) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) })) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then((t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }), (t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) })) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: return { url: t.url || t.openUrl || t["open-url"] }; case "Loon": return { openUrl: t.openUrl || t.url || t["open-url"], mediaUrl: t.mediaUrl || t["media-url"] }; case "Quantumult X": return { "open-url": t["open-url"] || t.url || t.openUrl, "media-url": t["media-url"] || t.mediaUrl, "update-pasteboard": t["update-pasteboard"] || t.updatePasteboard }; case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
