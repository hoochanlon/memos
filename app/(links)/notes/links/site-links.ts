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
          description: '隐私保护搜索引擎',
      }),
      createSite({
        name: 'Glarity',
        url: 'https://askai.glarity.app/zh-CN/search',
        description: 'Glarity 问答',
      }),
      createSite({
        name: 'tryallai',
        url: 'https://www.tryallai.org/list/#/login',
        description: '体验各种 AI 工具。',
      }),
      createSite({
        name: '日计',
        url: 'https://cent.linkai.work/',
        description: '记账 Github 版',
      }),
      createSite({
        url: 'https://app.binpay.cc',
        description: '虚拟海外信用卡开通服务',
      }),
      createSite({
        name: '欧易',
        url: 'https://www.okx.com/zh-hans',
        description: '比特币等虚拟货币交易所',
      }),
      createSite({
        name: 'ITDog',
        url: 'https://www.itdog.cn/',
        description: '网络运维工具',
      }),
      createSite({
        name: 'Pinterest',
        url: 'https://www.pinterest.com',
        description: '图片收藏分享平台',
      }),
      createSite({
        name: 'pixiv',
        url: 'https://www.pixiv.net',
        description: '日本插画分享平台',
      }),
      createSite({
        name: 'picx',
        url: 'https://picx.xpoet.cn',
        description: 'PicX 是一款基于 GitHub API 开发的图床工具',
      }),
      createSite({
        name: 'img.remit.ee',
        url: 'https://img.remit.ee',
        description: '免费图床，相对自由度较高',
      }),
      createSite({
        name: 'freeimg',
        url: 'https://www.freeimg.cn/',
        description: '免费图床，国内约束较多',
      }),
      createSite({
        name: 'filext',
        url: 'https://filext.com/zh',
        description: '预览未知格式文件',
      }),
      createSite({
        name: 'toolify',
        url: 'https://www.toolify.ai/zh',
        description: 'AI 工具箱',
      }),
    ],
  },
  {
    category: 'Github 加速',
    sites: [
      createSite({
        name: 'supergit',
        url: 'https://csjrb.top/supergit.html',
        description: 'Github 加速扩展',
      }),
      createSite({
        name: 'gh-proxy',
        url: 'https://gh-proxy.com',
        icon: '/icons/github.svg',
        description: 'Github 加速代理',
      }),
      createSite({
        name: 'gh.llkk.cc',
        url: 'https://gh.llkk.cc',
        icon: '/icons/github.svg',
        description: 'Github 加速代理',
      }),
    ],
  },
  {
    category: 'Meta 数据采集',
    sites: [
      createSite({
        name: 'favicon.im',
        url: 'https://favicon.im/zh',
        description: '网页图标采集器',
      }),
      createSite({
        name: 'microlink.io',
        url: 'https://microlink.io/',
        description: '网站信息采集器',
      }),
      createSite({
        name: 'sitesnapper.app',
        url: 'https://sitesnapper.app/zh',
        description: '完整归档网页内容',
      }),
    ],
  },
  {
    category: '图床',
    sites: [
      createSite({
        name: 'ooxx.ooo',
        url: 'https://ooxx.ooo',
        description: 'v2ex 图床',
      }),
      createSite({
        name: 'postimages',
        url: 'https://postimages.org',
        description: '国外老牌图床',
      }),
      createSite({
        name: 'freeimage.host',
        url: 'https://freeimage.host/',
        description: '国外老牌图床',
      }),
      createSite({
        name: 'lvse.eu.org',
        url: 'https://lvse.eu.org',
        description: '绿色图床',
      }),
      createSite({
        name: 'sm.ms',
        url: 'https://sm.ms',
        description: '老牌付费图床',
      }),
      createSite({
        name: 'imagekit',
        url: 'https://imagekit.io/',
        description: '存储桶、CDN 服务',
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
        description: '图片转换图标服务',
      }),
      createSite({
        name: 'uutool.cn',
        url: 'https://uutool.cn/web-icon',
        description: '网站图标下载工具',
      }),
      createSite({
        name: 'svgconverter',
        url: 'https://svgconverter.com/zh/png-to-svg',
        description: '常规格式图片转换 SVG',
      }),
      createSite({
        name: 'iconify',
        url: 'https://icon-sets.iconify.design/',
        description: '类 Font Asesome 图标库',
      }),
      createSite({
        name: 'google icons',
        url: 'https://fonts.google.com/icons',
        description: 'Google Icons 图标库',
      }),
      createSite({
        name: 'font awesome',
        url: 'https://fontawesome.com',
        description: 'Font Awesome 图标库',
      }),
    ],
  },
  {
    category: '图像处理',
    sites: [
      createSite({
        name: '动漫图片超分辨率',
        url: 'https://real-cugan.animesales.xyz/',
        description: '提高动漫图片清晰度、分辨率',
      }),
      createSite({
        name: 'Bigjpg',
        url: 'https://Bigjpg.com/',
        description: '提高图片清晰度、分辨率',
      }),
      createSite({
        name: 'circlecropimage',
        url: 'https://circlecropimage.com/zh-cn/',
        description: '可将矩形图片转换为圆形形状',
      }),
      createSite({
        name: 'ezremove.ai',
        url: 'https://ezremove.ai/zh/text-remover/',
        description: 'AI 一键去水印',
      }),
      createSite({
        name: 'squoosh',
        url: 'https://squoosh.app',
        description: '单张图片极致压缩',
      }),
      createSite({
        name: 'ai-cartoon-figure',
        url: 'https://ai-cartoon-figure.club/',
        description: 'AI 卡通图生成',
      }),
      createSite({
        name: 'aspose-photo',
        url: 'https://products.aspose.app/words/zh-hant/merger/photo#',
        description: '在線合併照片。',
      }),
      createSite({
        name: 'pixtoolkits',
        url: 'https://www.pixtoolkits.com/zh',
        description: '图片编辑工具',
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
        description: '探索一系列高质量的桌面和移动设备壁纸。从自然风景和抽象艺术到未来设计，找到完美的背景来提升您的屏幕。',
      }),
      createSite({
        name: 'dynamicwallpaper',
        url: 'https://www.dynamicwallpaper.club',
        description: 'Create and share Dynamic Wallpapers for macOS.',
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
        description: 'B站封面提取',
      }),
      createSite({
        name: 'downcats',
        url: 'https://www.downcats.com/zh/bilibili',
        description: '短视频下载',
      }),
      createSite({
        name: 'imageyoutube',
        url: 'https://imageyoutube.com/thumbnail-download/cn',
        description: 'YouTube 视频封面提取工具',
      }),
      createSite({
        name: 'youtube.iiilab',
        url: 'https://youtube.iiilab.com/',
        description: 'YouTube 高清视频下载',
      }),
      createSite({
        name: 'tubeninja',
        url: 'https://www.tubeninja.net',
        description: '支持 P、X 站视频下载',
      }),
      createSite({
        name: 'kedou',
        url: 'https://www.kedou.life',
        description: '泛用型视频解析下载',
      }),
    ],
  },
  {
    category: '音频流媒体',
    sites: [
      createSite({
        name: 'spotify',
        url: 'https://open.spotify.com/',
        description: '音乐流媒体服务',
      }),
      createSite({
        name: 'lxmusic',
        url: 'https://www.lxmusic.cc',
        description: '不止音源，还有其他福利资源',
      }),
      createSite({
        name: 'rainyscope',
        url: 'https://rainyscope.com',
        description: '白噪音网站',
      }),
    ],
  },
  {
    category: '特别攻略组',
    sites: [
      createSite({
        name: 'OCG大师规则',
        url: 'https://ocg-rulebook.readthedocs.io/zh-cn/latest/chapters/c02_master_rule.html',
        description: '游戏王OCG完全规则书2020的中文翻译。',
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
        name: '小白 API 接口',
        url: 'https://api.bducds.com',
      }),
    ],
  },
  {
    category: '教育工具',
    sites: [
      createSite({
        name: 'myscript',
        url: 'https://webdemo.myscript.com/views/math/index.html#',
        description: '数学公式识别和输入工具。',
      }),
      createSite({
        name: 'labex',
        url: 'https://labex.io/zh',
        description: '在线学习和实验真实的项目',
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
        description: '学习如何使用 Cursor',
      }),
      createSite({
        name: 'ioDraw 模版',
        url: 'https://www.iodraw.com/template',
        description: '配合“Cursor 实践案例”使用，将搜索到模版喂给 Cursor',
      }),
    ],
  },
];

