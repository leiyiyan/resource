const Body = JSON.parse($response.body);
const url = $request.url;

const actions = {
    'homeInit': () => {
        Body.data.startupPage = {};
        Body.data.templates = Body.data.templates.filter(e => !e.name.match(/主轮播图|保险推荐|专享|腰封轮播图|浮标配置|二楼营销位|首页主题/));
    },
    'myPageConfigList': () => {
        Body.data.YFList = [];
    }
};

const actionKey = Object.keys(actions).find(key => url.includes(key));
actions[actionKey]?.();

$done({ body: JSON.stringify(Body) });