import { createSite } from './site-utils';

// 网站导航数据类型定义
export interface Site {
  name?: string; // 可选，如果不提供会自动从 microlink.io API 获取 title
  url: string;
  description?: string; // 可选，如果不提供会自动从 microlink.io API 获取 description
  icon: string; // 可以是 emoji 或图片 URL
}

export interface SiteCategory {
  category: string;
  description?: string; // 可选，分类的描述文字
  sites: Site[];
}

// 网站导航数据
// 使用 createSite 辅助函数，如果不提供 icon，会自动从 URL 生成 favicon URL
export const siteLinks: SiteCategory[] = [
  {
    category: '常用工具',
    sites: [
      createSite({
          name: 'DuckDuckGo',
          url: 'https://duckduckgo.com/',
        //   description: '',
        // icon 会自动生成为 https://favicon.im/baidu.com
      }),
      createSite({
        name: 'Glarity',
        url: 'https://askai.glarity.app/zh-CN/search',
        description: 'Glarity 问答，您的知识百科全书。只需提出任何问题，您将在这里找到答案。',
      }),
      createSite({
        name: 'tryallai',
        url: 'https://www.tryallai.org/list/#/login',
        description: '体验各种 AI 工具。',
      }),
      createSite({
        name: '日计',
        url: 'https://cent.linkai.work/',
        description: '记账 Github Web 版',
      }),
      createSite({
        url: 'https://app.binpay.cc',
        description: 'BinPay 虚拟海外信用卡开通及支付网站',
      }),
      createSite({
        name: '欧易',
        url: 'https://www.okx.com/zh-hans',
      }),
      createSite({
        name: 'ITDog',
        url: 'https://www.itdog.cn/',
      }),
      createSite({
        name: 'Pinterest',
        url: 'https://www.pinterest.com',
      }),
      createSite({
        name: 'pixiv',
        url: 'https://www.pixiv.net',
      }),
      createSite({
        name: 'picx',
        url: 'https://picx.xpoet.cn',
      }),
      createSite({
        name: 'img.remit.ee',
        url: 'https://img.remit.ee',
      }),
      createSite({
        name: 'freeimg',
        url: 'https://www.freeimg.cn/',
      }),
      createSite({
        name: 'filext',
        url: 'https://filext.com/zh',
      }),
      createSite({
        name: 'toolify',
        url: 'https://www.toolify.ai/zh',
      }),
    ],
  },
  {
    category: 'Github 加速',
    sites: [
      createSite({
        name: 'supergit',
        url: 'https://csjrb.top/supergit.html',
      }),
      createSite({
        name: 'gh-proxy',
        url: 'https://gh-proxy.com',
      }),
      createSite({
        name: 'ghproxy.link',
        url: 'https://ghproxy.link',
      }),
    ],
  },
  {
    category: 'Meta 数据采集',
    sites: [
      createSite({
        name: 'favicon.im',
        url: 'https://favicon.im/zh',
      }),
      createSite({
        name: 'microlink.io',
        url: 'https://microlink.io/',
      }),
      createSite({
        name: 'linkpreview',
        url: 'https://linkpreview.net/',
      }),
    ],
  },
  {
    category: '图床',
    sites: [
      createSite({
        name: 'ooxx.ooo',
        url: 'https://ooxx.ooo',
      }),
      createSite({
        name: 'postimages',
        url: 'https://postimages.org',
      }),
      createSite({
        name: 'freeimage.host',
        url: 'https://freeimage.host/',
      }),
      createSite({
        name: 'lvse.eu.org',
        url: 'https://lvse.eu.org',
      }),
      createSite({
        name: 'sm.ms',
        url: 'https://sm.ms',
      }),
      createSite({
        name: 'imagekit',
        url: 'https://imagekit.io/',
      }),
    ],
  },
  {
    category: '图标',
    sites: [
      createSite({
        name: 'favicon.io',
        url: 'https://favicon.io/',
        icon: '/icons/favicon.io.svg',
      }),
      createSite({
        name: 'uutool.cn',
        url: 'https://uutool.cn/web-icon',
      }),
      createSite({
        name: 'svgconverter',
        url: 'https://svgconverter.com/zh/png-to-svg',
      }),
      createSite({
        name: 'iconify',
        url: 'https://icon-sets.iconify.design/',
      }),
      createSite({
        name: 'google icons',
        url: 'https://fonts.google.com/icons',
      }),
      createSite({
        name: 'font awesome',
        url: 'https://fontawesome.com',
      }),
    ],
  },
  {
    category: '图像处理',
    sites: [
      createSite({
        url: 'https://real-cugan.animesales.xyz/',
      }),
      createSite({
        name: 'bigjpg',
        url: 'https://Bigjpg.com/',
      }),
      createSite({
        url: 'https://circlecropimage.com/zh-cn/',
      }),
      createSite({
        url: 'https://ezremove.ai/zh/text-remover/',
      }),
      createSite({
        url: 'https://squoosh.app',
      }),
      createSite({
        name: 'AI 卡通图生成',
        url: 'https://ai-cartoon-figure.club/',
      }),
      createSite({
        url: 'https://tool.xuecan.net/image-resize/',
      }),
      createSite({
        name: 'aspose-photo',
        url: 'https://products.aspose.app/words/zh-hant/merger/photo#',
        description: '在線合併照片。按您需要的順序輕鬆合併兩張或多張照片。',
      }),
      createSite({
        name: '在线图片工具箱',
        url: 'https://phototool.cn/type/color/',
      }),
    ],
  },
  {
    category: '壁纸',
    sites: [
      createSite({
        name: '每日必应',
        url: 'https://dailybing.com/',
      }),
      createSite({
        name: 'Peapix',
        url: 'https://peapix.com/',
      }),
      createSite({
        name: '拾光壁纸',
        url: 'https://gallery.timeline.ink/',
      }),
      createSite({
        name: 'vsthemes.org',
        url: 'https://vsthemes.org/en/',
        description: 'Create a unique Windows and desktop design. Download beautiful themes, stylish wallpapers, as well as skins to personalize the interface of the operating system absolutely for free.',
      }),
      createSite({
        name: 'best-wallpaper',
        url: 'https://cn.best-wallpaper.net',
      }),
      createSite({
        name: 'wallpic',
        url: 'https://wallspic.com/cn',
      }),
      createSite({
        name: 'wallpaperalchemy',
        url: 'https://www.wallpaperalchemy.com/zh-CN',
      }),
      createSite({
        name: 'dynamicwallpaper',
        url: 'https://www.dynamicwallpaper.club',
      }),
      createSite({
        name: 'wallpaperhub',
        url: 'https://www.wallpaperhub.app/',
      }),
    ],
  },
  {
    category: '视频网站元素提取',
    sites: [
      createSite({
        name: 'blicover.magicbox',
        url: 'https://blicover.magicbox.top/',
        description: 'B站视频封面提取工具',
      }),
      createSite({
        name: 'downcats',
        url: 'https://www.downcats.com/zh/bilibili',
      }),
      createSite({
        name: 'imageyoutube',
        url: 'https://imageyoutube.com/thumbnail-download/cn',
      }),
      createSite({
        name: 'YouTube高清视频下载',
        url: 'https://youtube.iiilab.com/',
      }),
      createSite({
        name: 'tubeninja',
        url: 'https://www.tubeninja.net',
      }),
      createSite({
        name: 'kedou',
        url: 'https://www.kedou.life',
      }),
    ],
  },
  {
    category: '音频流媒体',
    sites: [
      createSite({
        name: 'spotify',
        url: 'https://open.spotify.com/',
      }),
      createSite({
        name: 'lxmusic',
        url: 'https://www.lxmusic.cc',
      }),
      createSite({
        name: 'rainyscope',
        url: 'https://rainyscope.com',
      }),
    ],
  },
  {
    category: '特别攻略组',
    sites: [
      createSite({
        url: 'https://ocg-rulebook.readthedocs.io/zh-cn/latest/chapters/c02_master_rule.html',
      }),
      createSite({
        name: '女神转生WIKI',
        url: 'https://wiki.biligame.com/persona',
        description: '女神转生WIKI 真女神转生 女神异闻录 P5 P5R P5S',
      }),
    ],
  },
  {
    category: 'API',
    sites: [
      createSite({
        name: '小小 API',
        url: 'https://xxapi.cn/api-market',
      }),
      createSite({
        name: 'UApiPro',
        url: 'https://uapis.cn',
      }),
      createSite({
        name: 'API Store',
        url: 'https://apis.jxcxin.cn',
      }),
      createSite({
        name: '小白 API 接口',
        url: 'https://api.bducds.com',
      }),
      createSite({
        name: 'apilayer',
        url: 'https://marketplace.apilayer.com/',
      }),
      createSite({
        name: 'public-api-lists',
        url: 'https://github.com/public-api-lists/public-api-lists',
        description: '🚀 A hand-curated list of free, open, and developer-friendly APIs',
      }),
    ],
  },
  {
    category: '教育工具',
    sites: [
      createSite({
        name: 'myscript',
        url: 'https://webdemo.myscript.com/views/math/index.html#',
        description: '数学公式识别和输入工具，支持手写、扫描和图片输入。',
      }),
      createSite({
        name: 'labex',
        url: 'https://labex.io/zh',
        description: '通过互动实验和真实项目，掌握 Linux、DevOps、网络安全、编程、数据科学等技能。',
      }),
      createSite({
        name: 'overleaf',
        url: 'https://www.overleaf.com',
        description: '在线 LaTeX 编辑器',
      }),
      createSite({
        name: 'free-for.dev',
        url: 'https://free-for.dev/#/',
      }),
      createSite({
        name: 'Cursor 实践案例',
        url: 'https://cursorpractice.com/zh/cursor-sharing/Still-Drawing-drawio-Manually-zh',
        description: '学习如何利用Cursor工具快速生成精美的drawio架构图，告别耗时的手绘流程，提升画图效率。包含Mermaid图对比和实战技巧，适合开发者和设计师。',
      }),
      createSite({
        name: 'ioDraw 模版',
        url: 'https://www.iodraw.com/template',
        description: '支持流程图、思维导图、甘特图、在线白板、在线图表和海报设计',
      }),
    ],
  },
];

