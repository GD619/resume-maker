/* =========================================================
   简历工坊 app.js —— v3
   原生 JS 单页应用：模板选择(5套) / 内容编辑 / 实时预览 /
   模块管理面板 / 头像上传 / 对齐设置 / 导出 PDF·PNG·JSON /
   草稿自动保存 / 皮肤切换
   ========================================================= */
'use strict';

/* ---------- 常量 ---------- */
const STORAGE_KEY = 'resume_data_v1';     // 需求文档第七节指定键名
const GUIDE_KEY = 'resume_guide_seen_v1'; // 新手引导「不再显示」标记

/* 皮肤配置表（皮肤商店预留：每套皮肤带 price 与 locked 状态） */
const SKINS = {
  default: {
    name: '默认浅色', price: 0, locked: false,
    vars: {
      '--bg': '#EDF1F7', '--panel': '#FFFFFF', '--panel-2': '#E2E9F3',
      '--text': '#22304A', '--text-2': '#5C6B82', '--border': '#D2DCEA',
      '--primary': '#2563EB', '--primary-hover': '#1D4ED8', '--on-primary': '#FFFFFF',
      '--danger': '#DC2626',
      '--shadow': '0 1px 3px rgba(37,60,110,.10)', '--shadow-lg': '0 10px 26px rgba(37,60,110,.14)',
      '--toast-bg': '#22304A', '--toast-text': '#F4F7FC',
      '--bg-deco': 'radial-gradient(720px 520px at 4% 0%, rgba(37,99,235,.08), transparent 62%), radial-gradient(720px 520px at 96% 100%, rgba(37,99,235,.06), transparent 62%)'
    }
  },
  dark: {
    name: '深色护眼', price: 0, locked: false,
    vars: {
      '--bg': '#16191D', '--panel': '#1F242B', '--panel-2': '#252B33',
      '--text': '#D7DBE0', '--text-2': '#9AA3AD', '--border': '#363E47',
      '--primary': '#4A8DDB', '--primary-hover': '#6AA5E8', '--on-primary': '#FFFFFF',
      '--danger': '#E07070',
      '--shadow': '0 1px 3px rgba(0,0,0,.4)', '--shadow-lg': '0 8px 24px rgba(0,0,0,.5)',
      '--toast-bg': '#E8EAED', '--toast-text': '#1F242B',
      '--bg-deco': 'radial-gradient(720px 520px at 4% 0%, rgba(74,141,219,.10), transparent 62%), radial-gradient(720px 520px at 96% 100%, rgba(74,141,219,.06), transparent 62%)'
    }
  },
  vivid: { // 多彩活力：暖纸底 + 低饱和撞色（ teal 主色，粉/黄/青点缀）
    name: '多彩活力', price: 0, locked: false,
    vars: {
      '--bg': '#F7F3EC', '--panel': '#FFFFFF', '--panel-2': '#F3EADC',
      '--text': '#3B362E', '--text-2': '#8B8172', '--border': '#E7DCC8',
      '--primary': '#2A9D8F', '--primary-hover': '#238C7F', '--on-primary': '#FFFFFF',
      '--danger': '#D9534F',
      '--shadow': '0 1px 3px rgba(90,70,40,.12)', '--shadow-lg': '0 10px 26px rgba(90,70,40,.16)',
      '--toast-bg': '#3B362E', '--toast-text': '#FBF7EF',
      '--bg-deco': 'radial-gradient(640px 460px at 2% 0%, rgba(233,114,147,.10), transparent 65%), radial-gradient(700px 520px at 98% 100%, rgba(42,157,143,.10), transparent 65%), radial-gradient(500px 400px at 100% 0%, rgba(240,180,60,.09), transparent 65%)'
    }
  },
  candy: { // 糖果粉可爱风：柔和粉底 + 玫红主色
    name: '糖果粉', price: 0, locked: false,
    vars: {
      '--bg': '#FCEFF5', '--panel': '#FFFFFF', '--panel-2': '#F9E2EE',
      '--text': '#4A2E3E', '--text-2': '#A3758F', '--border': '#F2C9DE',
      '--primary': '#E85A9B', '--primary-hover': '#D1438A', '--on-primary': '#FFFFFF',
      '--danger': '#E05A6B',
      '--shadow': '0 1px 3px rgba(190,80,140,.12)', '--shadow-lg': '0 10px 26px rgba(190,80,140,.16)',
      '--toast-bg': '#4A2E3E', '--toast-text': '#FDEFF6',
      '--bg-deco': 'radial-gradient(680px 500px at 0% 0%, rgba(232,90,155,.12), transparent 65%), radial-gradient(720px 520px at 100% 100%, rgba(180,120,220,.10), transparent 65%)'
    }
  }
};

/* 简历模板配置表（9 套，风格各异） */
const TEMPLATES = {
  simple:   { name: '简洁',       desc: '黑白灰极简排版，细分割线，适合大多数岗位' },
  business: { name: '商务',       desc: '深蓝头部色带，沉稳专业，适合金融 / 国企' },
  creative: { name: '现代创意',   desc: '左侧边栏双栏布局，层次分明，适合设计 / 互联网' },
  classic:  { name: '经典左对齐', desc: '姓名靠左、头像居右，正文规整，百搭稳重' },
  fresh:    { name: '清新名片',   desc: '浅色头卡配圆角头像，色块标题，年轻亲和' },
  sidebar:  { name: '深色侧栏',   desc: '深色侧边放个人信息与头像，主区放经历，对比强烈' },
  minimal:  { name: '极简大字',   desc: '大姓名大留白，去装饰的呼吸感排版' },
  timeline: { name: '时间轴',     desc: '经历沿时间轴展开，成长路径一目了然' },
  data:     { name: '数据卡片',   desc: '区块成卡片、日期成药丸徽章，信息密度高' }
};
/* 双栏模板的侧栏区块分配（栏内相对顺序仍跟随用户排序） */
const SIDE_MAP = { creative: ['basic', 'education'], sidebar: ['basic', 'coreSkills'] };

/* 标题主题色调色盘（控制简历内「大标题 + 标题下横线」颜色，与网站皮肤相互独立） */
const PALETTE = [
  '#1F4E8C', '#2563EB', '#4F46E5', '#9333EA', '#C026D3', '#E11D48',
  '#DC2626', '#EA8600', '#CA8A04', '#65A30D', '#16A34A', '#0F766E',
  '#14B8A6', '#0E7490', '#334155', '#111827', '#B45309'
];

/* 简历字体表：全部使用操作系统自带字体，离线可用、导出不丢字 */
const FONTS = {
  system: { name: '系统默认', stack: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif' },
  yahei:  { name: '微软雅黑', stack: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  hei:    { name: '黑体',     stack: 'SimHei, "Heiti SC", "Microsoft YaHei", sans-serif' },
  song:   { name: '宋体',     stack: 'SimSun, "Songti SC", serif' },
  kai:    { name: '楷体',     stack: 'KaiTi, "Kaiti SC", STKaiti, serif' }
};

/* 内联 SVG 图标（替代 emoji，风格统一） */
const ICONS = {
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.7L19.5 9l-5.7 1.8L12 16.5l-1.8-5.7L4.5 9l5.7-1.3z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z"/></svg>'
};

/* 区块定义：驱动左侧表单与预览渲染（技能清单已按用户要求彻底移除） */
const SECTION_DEFS = {
  basic: {
    title: '基本信息', type: 'basic',
    fields: [
      { key: 'name',     label: '姓名',     ph: '如：张三' },
      { key: 'position', label: '求职意向（意向岗位）', ph: '如：前端开发实习生' },
      { key: 'gender',   label: '性别',     type: 'select', options: ['', '男', '女'], half: true },
      { key: 'age',      label: '年龄',     ph: '如：22', half: true },
      { key: 'phone',    label: '电话',     ph: '如：138xxxx8888', half: true },
      { key: 'email',    label: '邮箱',     ph: '如：hi@example.com', half: true },
      { key: 'city',     label: '所在地',   ph: '如：广州', half: true },
      { key: 'website',  label: '个人主页 / 作品链接', ph: '如：github.com/你的名字', half: true }
    ]
  },
  /* 「更多信息（选填）」折叠区字段：全部下拉选择（禁止手填），选了才显示 */
  basicExtra: [
    { key: 'nation', label: '民族', options: ['汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '布依族', '朝鲜族', '满族', '侗族', '瑶族', '白族', '土家族', '哈尼族', '哈萨克族', '傣族', '黎族', '僳僳族', '佤族', '畲族', '高山族', '拉祜族', '水族', '东乡族', '纳西族', '景颇族', '柯尔克孜族', '土族', '达斡尔族', '仫佬族', '羌族', '布朗族', '撒拉族', '毛南族', '仡佬族', '锡伯族', '阿昌族', '普米族', '塔吉克族', '怒族', '乌孜别克族', '俄罗斯族', '鄂温克族', '德昂族', '保安族', '裕固族', '京族', '塔塔尔族', '独龙族', '鄂伦春族', '赫哲族', '门巴族', '珞巴族', '基诺族'] },
    { key: 'political', label: '政治面貌', options: ['中共党员', '中共预备党员', '共青团员', '民革党员', '民盟盟员', '民建会员', '民进会员', '农工党党员', '致公党党员', '九三学社社员', '台盟盟员', '无党派人士', '群众'] },
    { key: 'hukou', label: '户籍', options: ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区', '台湾省'] }
  ],
  education: {
    title: '教育经历', type: 'list',
    fields: [
      { key: 'school',  label: '学校', ph: '如：某某大学', half: true },
      { key: 'degree',  label: '学历', ph: '本科 / 硕士', half: true },
      { key: 'major',   label: '专业', ph: '如：计算机科学与技术', half: true },
      { key: 'gpa',     label: 'GPA（选填）', ph: '如：3.6/4.0', half: true },
      { key: 'start',   label: '开始时间', ph: '2022.09', half: true },
      { key: 'end',     label: '结束时间', ph: '2026.06', half: true },
      { key: 'courses', label: '主修课程（选填）', ph: '如：数据结构、操作系统、计算机网络', area: true },
      { key: 'honors',  label: '荣誉 / 证书（选填）', ph: '如：一等奖学金、英语六级 560 分' }
    ],
    newItem: () => ({ school: '', major: '', degree: '', start: '', end: '', gpa: '', courses: '', honors: '' })
  },
  projects: {
    title: '项目经历', type: 'list',
    fields: [
      { key: 'name',  label: '项目名', ph: '如：校园二手交易平台', half: true },
      { key: 'role',  label: '担任角色', ph: '如：前端负责人', half: true },
      { key: 'start', label: '开始时间', ph: '2025.03', half: true },
      { key: 'end',   label: '结束时间', ph: '2025.06', half: true },
      { key: 'tech',  label: '技术栈', ph: '如：Vue3 / Node.js / MySQL' },
      { key: 'desc',  label: '项目描述（支持换行）', ph: '每行写一条亮点', area: true, ai: true }
    ],
    newItem: () => ({ name: '', role: '', start: '', end: '', tech: '', desc: '' })
  },
  work: {
    title: '实习 / 工作经历', type: 'list',
    fields: [
      { key: 'company', label: '公司 / 单位', ph: '如：某科技公司', half: true },
      { key: 'role',    label: '岗位', ph: '如：前端开发实习生', half: true },
      { key: 'start',   label: '开始时间', ph: '2025.07', half: true },
      { key: 'end',     label: '结束时间', ph: '2025.12', half: true },
      { key: 'desc',    label: '工作内容（支持换行）', ph: '每行写一条，突出成果与数据', area: true, ai: true }
    ],
    newItem: () => ({ company: '', role: '', start: '', end: '', desc: '' })
  },
  coreSkills: { title: '核心技能', type: 'coreSkills', newGroup: () => ({ name: '', tags: [] }) },
  summary: { title: '自我评价', type: 'text' },
  /* 自定义模块：每条是一个独立模块（id 稳定，可单独排序/显隐/移除） */
  custom: { title: '自定义区块', type: 'custom' }
};

/* 生成自定义模块的稳定 id */
let cidCounter = 0;
const genId = () => 'c' + Date.now().toString(36) + (cidCounter++);

/* ---------- 默认草稿（v3：删技能清单、layout 对齐、头像、模块化自定义区块） ---------- */
function defaultData() {
  return {
    version: 3,
    templateId: 'simple',
    themeColor: '#1F4E8C',
    skin: 'default',
    unlockedSkins: ['default', 'dark', 'vivid', 'candy'], // 四套皮肤全部可用（price 字段为商店预留）
    fontScale: 'standard',
    font: 'system',                     // 简历字体
    layout: { align: 'left', titleAlign: 'left', contactMode: 'label' }, // 页头对齐 / 标题对齐 / 联系方式标签模式
    sectionOrder: ['basic', 'education', 'projects', 'work', 'coreSkills', 'summary', 'custom:c1'],
    colOrder: ['nav', 'manage', 'preview'], // 编辑器三栏排列（拖拽换位后持久化）
    sections: {
      basic: { visible: true, name: '', position: '', gender: '', age: '', phone: '', email: '', city: '', website: '', nation: '', political: '', hukou: '', avatar: '' },
      education: { visible: true, items: [SECTION_DEFS.education.newItem()] },
      projects: { visible: true, items: [SECTION_DEFS.projects.newItem()] },
      work: { visible: true, items: [SECTION_DEFS.work.newItem()] },
      coreSkills: { visible: true, groups: [{ name: '核心技能', tags: [] }] }, // 简洁标签，无进度条
      summary: { visible: true, text: '' },
      custom: { items: [{ id: 'c1', title: '', text: '', visible: true }] } // 自定义模块集合
    }
  };
}

/* ---------- 模块 id 辅助（自定义模块用 'custom:<id>' 虚拟 id） ----------
   注意：必须定义在 loadData() 调用之前（normalizeData 的 filter 会用到 isCustomId） */
const isCustomId = id => typeof id === 'string' && id.startsWith('custom:');
const customItem = id => data.sections.custom.items.find(it => ('custom:' + it.id) === id);
function moduleName(id) {
  if (isCustomId(id)) {
    const it = customItem(id);
    return (it && it.title.trim()) || '未命名模块'; // 直接显示模块名，不带「自定义」前缀
  }
  return SECTION_DEFS[id] ? SECTION_DEFS[id].title : id;
}
function secVisible(id) {
  if (isCustomId(id)) { const it = customItem(id); return it ? it.visible !== false : false; }
  return data.sections[id] ? data.sections[id].visible !== false : false;
}
function setSecVisible(id, v) {
  if (isCustomId(id)) { const it = customItem(id); if (it) it.visible = v; }
  else if (data.sections[id]) data.sections[id].visible = v;
}

/* ---------- 全局状态 ---------- */
let hadDraft = false;
let data = loadData();
let currentSection = 'basic';
let saveTimer = null;
let printPlaceholder = null;

/* ---------- 小工具 ---------- */
const $ = id => document.getElementById(id);
const preview = () => $('resume-preview');
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'warn' ? ' warn' : '');
  el.textContent = msg;
  $('toast-root').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2200);
}
function showLoading(msg) { $('loading-text').textContent = msg; $('loading-mask').classList.remove('hidden'); }
function hideLoading() { $('loading-mask').classList.add('hidden'); }

/* ---------- 草稿：读取 / 保存 / 迁移 ---------- */
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData();
  try {
    hadDraft = true;
    return normalizeData(JSON.parse(raw));
  } catch (e) {
    console.warn('草稿数据损坏，已重置', e);
    return defaultData();
  }
}
function mergeDeep(base, over) {
  if (Array.isArray(over)) return over;
  if (over && typeof over === 'object') {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = mergeDeep(base?.[k], over[k]);
    return out;
  }
  return over === undefined ? base : over;
}
/* 数据规整：深合并默认值 + 版本迁移 + 合法性兜底（加载草稿与导入 JSON 共用） */
function normalizeData(saved) {
  const d = mergeDeep(defaultData(), saved);
  if ((d.version || 1) < 3) {
    // v3 迁移：① 技能清单彻底移除（旧数据里的该区块一并忽略、不渲染）
    d.sectionOrder = (Array.isArray(d.sectionOrder) ? d.sectionOrder : []).filter(x => x !== 'skills');
    delete d.sections.skills;
    // ② 自定义区块改为「每条一个模块」，sectionOrder 用 custom:<id> 引用
    d.sections.custom.items.forEach(it => { if (!it.id) it.id = genId(); });
    const expanded = [];
    for (const x of d.sectionOrder) {
      if (x === 'custom') for (const it of d.sections.custom.items) expanded.push('custom:' + it.id);
      else expanded.push(x);
    }
    d.sectionOrder = expanded;
    d.version = 3;
  }
  // 通用兜底：引用合法、id 合法
  if (!Array.isArray(d.sectionOrder)) d.sectionOrder = defaultData().sectionOrder.slice();
  d.sections.custom.items.forEach(it => { if (!it.id) it.id = genId(); });
  const valid = new Set(['basic', 'education', 'projects', 'work', 'coreSkills', 'summary']);
  d.sectionOrder = d.sectionOrder.filter(x =>
    valid.has(x) || (isCustomId(x) && d.sections.custom.items.some(it => 'custom:' + it.id === x)));
  if (!d.sectionOrder.includes('basic')) d.sectionOrder.unshift('basic');
  // 核心技能模块对老草稿自动补位（插到自我评价之前）
  if (!d.sectionOrder.includes('coreSkills')) {
    const si = d.sectionOrder.indexOf('summary');
    if (si >= 0) d.sectionOrder.splice(si, 0, 'coreSkills');
    else d.sectionOrder.push('coreSkills');
  }
  if (!d.sections.coreSkills || !Array.isArray(d.sections.coreSkills.groups))
    d.sections.coreSkills = { visible: true, groups: [{ name: '核心技能', tags: [] }] };
  if (!Array.isArray(d.colOrder) || d.colOrder.length !== 3 || !['nav', 'manage', 'preview'].every(x => d.colOrder.includes(x)))
    d.colOrder = ['nav', 'manage', 'preview'];
  if (!TEMPLATES[d.templateId]) d.templateId = 'simple';
  if (!Array.isArray(d.unlockedSkins)) d.unlockedSkins = ['default', 'dark', 'vivid', 'candy'];
  for (const s of ['vivid', 'candy']) if (!d.unlockedSkins.includes(s)) d.unlockedSkins.push(s); // 新皮肤对老草稿直接解锁
  if (!SKINS[d.skin] || !d.unlockedSkins.includes(d.skin)) d.skin = 'default';
  if (!FONTS[d.font]) d.font = 'system';
  if (!d.layout || typeof d.layout !== 'object') d.layout = { align: 'left', titleAlign: 'left', contactMode: 'label' };
  if (!['left', 'center', 'right'].includes(d.layout.align)) d.layout.align = 'left';
  if (!['left', 'center'].includes(d.layout.titleAlign)) d.layout.titleAlign = 'left';
  if (!['label', 'compact'].includes(d.layout.contactMode)) d.layout.contactMode = 'label';
  return d;
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const t = new Date();
  $('save-status').textContent = '已自动保存 ' +
    [t.getHours(), t.getMinutes(), t.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveData, 300); }

/* ---------- 皮肤系统 ---------- */
function applySkin(id, { silent = false } = {}) {
  const skin = SKINS[id];
  if (!skin) return;
  if (skin.locked || !data.unlockedSkins.includes(id)) {
    toast(`「${skin.name}」暂未解锁，将在皮肤商店上线后开放`, 'warn');
    return;
  }
  const root = document.documentElement;
  for (const [k, v] of Object.entries(skin.vars)) root.style.setProperty(k, v);
  root.dataset.skin = id; // 供 CSS 按皮肤显示专属装饰（如深色月亮）
  data.skin = id;
  saveData();
  renderSkinMenus();
  if (!silent) toast(`皮肤已切换：${skin.name}`);
}
function renderSkinMenus() {
  for (const boxId of ['skin-menu-home', 'skin-menu-editor']) {
    const box = $(boxId);
    if (!box) continue; // 编辑页已无主题切换入口（只在主页切换）
    const cur = SKINS[data.skin];
    box.innerHTML =
      `<button class="btn skin-btn" data-action="skin-menu">
         <span class="skin-dot" style="background:${esc(cur.vars['--bg'])}"></span>${esc(cur.name)}
       </button>
       <div class="dropdown hidden">` +
      Object.entries(SKINS).map(([id, s]) => {
        const locked = s.locked || !data.unlockedSkins.includes(id);
        return `<button class="dropdown-item ${id === data.skin ? 'active' : ''}" data-action="skin-pick" data-id="${id}">
          <span class="skin-dot" style="background:${esc(s.vars['--bg'] || '#ccc')}"></span>
          ${esc(s.name)}${locked ? `<span class="lock">${ICONS.lock} 未解锁</span>` : ''}
        </button>`;
      }).join('') + '</div>';
  }
}

/* ---------- 视图切换 ---------- */
function showView(name) {
  $('view-home').classList.toggle('hidden', name !== 'home');
  $('view-editor').classList.toggle('hidden', name !== 'editor');
  document.body.classList.remove('show-preview');
  window.scrollTo(0, 0);
  if (name === 'editor') {
    renderSectionNav(); renderForm(); renderModulePanel(); renderPalette(); renderPreview(); applyColOrder();
  } else {
    renderTemplateCards();
  }
}

/* ---------- 首页：模板卡片（缩略图 = 真实模板结构 + 差异化示例内容） ---------- */
const MINI_BASE = {
  name: '张三', position: '前端开发实习生',
  contacts: ['138-0000-8888', 'zhangsan@example.com', '广州'],
  edu: { school: '某某大学', sub: '本科 · 计算机科学与技术', date: '2022.09 ~ 2026.06', courses: '数据结构、操作系统' },
  proj: { name: '校园二手交易平台', sub: '前端负责人 · Vue3 / Node.js', date: '2025.03 ~ 2025.06', desc: '负责前端架构搭建，实现核心交易流程' }
};
/* 每套模板用不同示例人物，缩略图不再千篇一律 */
const MINI_OVERRIDES = {
  business: { name: '赵鹏', position: '财务分析实习生' },
  creative: { name: '周舟', position: 'UI 设计实习生' },
  sidebar:  { name: '林悦', position: '视觉设计师' },
  minimal:  { name: '李明', position: '产品经理', contacts: ['li.ming@example.com', '北京'] },
  timeline: { name: '王芳', position: '数据分析实习生' },
  data:     { name: '陈晨', position: '运营实习生' }
};
function miniPageHtml(tid) {
  const d = { ...MINI_BASE, ...(MINI_OVERRIDES[tid] || {}) };
  d.edu = MINI_BASE.edu; d.proj = MINI_BASE.proj;
  const avatarPh = `<div class="rp-avatar" style="background:#D8DEE8"></div>`; // 头像占位
  const info = `<div class="rp-hinfo">
    <div class="rp-name">${d.name}</div>
    <div class="rp-position">${d.position}</div>
    <div class="rp-contacts">${d.contacts.map(c => `<span>${c}</span>`).join('')}</div>
  </div>`;
  const headerPlain = `<div class="rp-header">${info}</div>`;
  const headerAvatar = `<div class="rp-header with-avatar">${info}${avatarPh}</div>`;
  const sec = (title, body) =>
    `<section class="rp-section"><div class="rp-sec-title"><span class="rp-sec-sq"></span>${title}<span class="rp-sec-line"></span></div>${body}</section>`;
  const edu = sec('教育经历', `<div class="rp-item"><i class="rp-dot"></i>
    <div class="rp-item-head"><span class="rp-item-title">${d.edu.school}</span><span class="rp-item-date">${d.edu.date}</span></div>
    <div class="rp-item-sub">${d.edu.sub}</div>
    <div class="rp-item-desc">主修课程：${d.edu.courses}</div></div>`);
  const proj = sec('项目经历', `<div class="rp-item"><i class="rp-dot"></i>
    <div class="rp-item-head"><span class="rp-item-title">${d.proj.name}</span><span class="rp-item-date">${d.proj.date}</span></div>
    <div class="rp-item-sub">${d.proj.sub}</div>
    <div class="rp-item-desc">${d.proj.desc}</div></div>`);
  const SIDE = SIDE_MAP[tid];
  if (SIDE) { // 双栏模板：与正式预览同一套分配逻辑
    const chips = sec('核心技能', `<span class="rp-tag">C/C++</span><span class="rp-tag">Unity</span><span class="rp-tag">Python</span>`);
    const partFor = id => id === 'basic' ? headerAvatar : (id === 'education' ? edu : chips);
    const side = SIDE.map(partFor).join('');
    const main = (SIDE.includes('education') ? '' : edu) + proj;
    return `<div class="rp-layout"><aside class="rp-side">${side}</aside><main class="rp-main">${main}</main></div>`;
  }
  if (tid === 'classic' || tid === 'fresh') {
    return `<div class="rp-inner">${headerAvatar}${edu}${proj}</div>`; // 左上信息、右上头像、下面正文
  }
  if (tid === 'minimal') {
    return `<div class="rp-inner">${headerPlain}${proj}</div>`; // 大字留白，只放一段示例
  }
  return `<div class="rp-inner">${headerPlain}${edu}${proj}</div>`;
}
function renderTemplateCards() {
  $('template-grid').innerHTML = Object.entries(TEMPLATES).map(([id, t]) => {
    const current = data.templateId === id;
    return `<div class="tpl-card ${current ? 'current' : ''}">
      <div class="mini"><div class="mini-page tpl-${id}" style="--resume-theme:#1F4E8C">${miniPageHtml(id)}</div></div>
      <div><h3>${esc(t.name)}${current ? ' ✓' : ''}</h3><p class="tpl-desc">${esc(t.desc)}</p></div>
      <button class="btn ${current ? 'btn-primary' : ''}" data-action="select-template" data-id="${id}">
        ${current ? '进入编辑' : '使用此模板'}
      </button>
    </div>`;
  }).join('');
  fitMinis();
  $('continue-bar').classList.toggle('hidden', !(hadDraft && !isResumeEmpty()));
}
function fitMinis() {
  document.querySelectorAll('.mini').forEach(box => {
    const page = box.querySelector('.mini-page');
    if (!page || !box.clientWidth) return;
    const s = box.clientWidth / 794;
    page.style.transform = `scale(${s})`;
    box.style.height = Math.min(page.scrollHeight * s, 340) + 'px';
  });
}
function switchTemplate(id, goEditor) {
  if (!TEMPLATES[id]) return;
  data.templateId = id;
  saveData();
  syncTemplateSelect();
  renderPreview();
  if (goEditor) showView('editor');
  toast(`已切换到「${TEMPLATES[id].name}」模板，已填内容全部保留`);
}
function syncTemplateSelect() {
  $('template-select').innerHTML = Object.entries(TEMPLATES)
    .map(([id, t]) => `<option value="${id}" ${id === data.templateId ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
}
function syncFontSelect() {
  $('font-select').innerHTML = Object.entries(FONTS)
    .map(([id, f]) => `<option value="${id}" ${id === data.font ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
}
/* 同步所有「对齐」下拉（中栏标题对齐 + 基本信息页头对齐） */
function syncLayoutControls() {
  document.querySelectorAll('select[data-layout]').forEach(sel => { sel.value = data.layout[sel.dataset.layout]; });
}

/* ---------- 编辑器：左栏区块导航 + 表单 ---------- */
function renderSectionNav() {
  $('section-nav').innerHTML = data.sectionOrder.map(id =>
    `<button data-action="nav-pick" data-id="${esc(id)}" class="${id === currentSection ? 'active' : ''}">${esc(moduleName(id))}</button>`
  ).join('');
}

function renderForm() {
  // 自定义模块单页表单（标题 + 内容 + 永久删除）
  if (isCustomId(currentSection)) {
    const it = customItem(currentSection);
    if (!it) { currentSection = 'basic'; return renderForm(); }
    $('section-form').innerHTML = `
      <h3 class="form-title">${esc(moduleName(currentSection))}</h3>
      <div class="field"><label>区块标题</label>
        <input data-c="title" data-cid="${it.id}" value="${esc(it.title)}" placeholder="如：获奖经历 / 证书 / 游戏经验"></div>
      <div class="field"><label>区块内容（支持换行）<button type="button" class="ai-btn" data-action="ai-polish" data-c="text" data-cid="${it.id}">${ICONS.spark}AI 美化</button></label>
        <textarea data-c="text" data-cid="${it.id}" rows="6" placeholder="填写该区块的具体内容">${esc(it.text)}</textarea></div>
      <button class="btn btn-danger-text" data-action="custom-del" data-id="${esc(currentSection)}">删除此自定义模块</button>`;
    return;
  }

  const def = SECTION_DEFS[currentSection];
  const sec = data.sections[currentSection];
  let html = `<h3 class="form-title">${esc(def.title)}</h3>`;

  if (def.type === 'basic') {
    // 头像上传 / 更换 / 删除
    html += `<div class="avatar-row">
      ${sec.avatar
        ? `<img class="avatar-cur" src="${sec.avatar}" alt="头像">`
        : `<div class="avatar-none">暂无<br>头像</div>`}
      <button class="btn btn-mini" data-action="avatar-upload">${sec.avatar ? '更换头像' : '上传头像'}</button>
      ${sec.avatar ? `<button class="btn btn-mini" data-action="avatar-del">删除</button>` : ''}
    </div>`;
    // 头像规范提示（可关闭，只做友好提醒）
    if (localStorage.getItem('avatar_tip_closed') !== '1') {
      html += `<div class="avatar-tip"><span>建议：正面、清晰、浅色背景的正式照片；避免自拍、生活照、动漫头像。</span><button class="btn btn-mini" data-action="avatar-tip-close" title="不再提示">×</button></div>`;
    }
    // 字段顺序：页头对齐 → 姓名 → 求职意向 → 性别/年龄 → 更多选填 → 电话 → 联系方式显示 → 邮箱/所在地/主页
    const F = (key, label, ph) => `<div class="field"><label>${label}</label>
      <input data-s="basic" data-f="${key}" value="${esc(sec[key])}" placeholder="${esc(ph)}"></div>`;
    const aligns = { left: '靠左', center: '居中', right: '靠右' };
    html += `<div class="field"><label>页头对齐</label>
      <select data-layout="align">${Object.entries(aligns).map(([v, t]) =>
        `<option value="${v}" ${data.layout.align === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
    html += F('name', '姓名', '如：张三');
    html += F('position', '求职意向（意向岗位）', '如：前端开发实习生');
    html += `<div class="field-row">
      <div class="field"><label>性别</label>
        <select data-s="basic" data-f="gender">${['', '男', '女'].map(o =>
          `<option value="${o}" ${sec.gender === o ? 'selected' : ''}>${o || '请选择'}</option>`).join('')}</select></div>
      ${F('age', '年龄', '如：22')}
    </div>`;
    // 更多信息（选填）折叠区：民族 / 政治面貌 / 户籍，全部下拉选择
    html += `<details class="more-fields"><summary>更多信息（选填）：民族 / 政治面貌 / 户籍</summary>` +
      SECTION_DEFS.basicExtra.map(f => `<div class="field"><label>${esc(f.label)}</label>
        <select data-s="basic" data-f="${f.key}">
          <option value="">请选择</option>
          ${f.options.map(o => `<option value="${esc(o)}" ${sec[f.key] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select></div>`).join('') +
      `</details>`;
    html += F('phone', '电话', '如：138xxxx8888');
    // 联系方式显示紧跟电话，上下相邻、布局连贯
    html += `<div class="field"><label>联系方式显示</label>
      <select data-layout="contactMode">
        <option value="label" ${data.layout.contactMode !== 'compact' ? 'selected' : ''}>标签模式（电话：138…）</option>
        <option value="compact" ${data.layout.contactMode === 'compact' ? 'selected' : ''}>紧凑模式（无标签前缀）</option>
      </select></div>`;
    html += `<div class="field-row">${F('email', '邮箱', '如：hi@example.com')}${F('city', '所在地', '如：广州')}</div>`;
    html += F('website', '个人主页 / 作品链接', '如：github.com/你的名字');
  } else if (def.type === 'coreSkills') {
    // 核心技能：分组 + 简洁标签编辑（回车添加关键词）
    html += sec.groups.map((g, gi) => `
      <div class="item-card">
        <div class="item-toolbar">
          <span class="item-no">分组 ${gi + 1}</span>
          <button class="btn btn-mini" data-action="cskill-group-del" data-g="${gi}" ${sec.groups.length <= 1 ? 'disabled' : ''}>删除分组</button>
        </div>
        <div class="field"><label>分组名（如：核心技能 / 相关技能）</label>
          <input data-s="coreSkills" data-g="${gi}" data-f="gname" value="${esc(g.name)}" placeholder="如：核心技能"></div>
        <div class="tag-editor">
          ${g.tags.map((t, ti) => `<span class="tag-chip">${esc(t)}<button type="button" data-action="tag-del" data-g="${gi}" data-t="${ti}" title="删除">×</button></span>`).join('')}
          <input class="tag-input" data-g="${gi}" placeholder="输入关键词，回车添加">
        </div>
      </div>`).join('');
    html += `<button class="btn add-item-btn" data-action="cskill-group-add">+ 添加分组</button>`;
  } else if (def.type === 'list') {
    html += sec.items.map((item, i) => `
      <div class="item-card">
        <div class="item-toolbar">
          <span class="item-no">第 ${i + 1} 条</span>
          <button class="btn btn-mini" data-action="item-up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-mini" data-action="item-down" data-i="${i}" ${i === sec.items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-mini" data-action="item-del" data-i="${i}">删除</button>
        </div>
        ${fieldsHtml(def.fields, item, currentSection, i)}
      </div>`).join('');
    html += `<button class="btn add-item-btn" data-action="item-add">+ 添加一条${esc(def.title)}</button>`;
  } else if (def.type === 'text') {
    html += `<div class="field"><label>${esc(def.title)}（支持换行）<button type="button" class="ai-btn" data-action="ai-polish" data-s="${currentSection}" data-f="text">${ICONS.spark}AI 美化</button></label>
      <textarea data-s="${currentSection}" data-f="text" rows="6" placeholder="用 2~4 句话介绍自己的优势与特点">${esc(sec.text)}</textarea></div>`;
  }
  $('section-form').innerHTML = html;
}

function fieldsHtml(fields, obj, s, i) {
  const idx = i >= 0 ? `data-i="${i}"` : '';
  let html = '', rowBuf = [];
  const flush = () => { if (rowBuf.length) { html += `<div class="field-row">${rowBuf.join('')}</div>`; rowBuf = []; } };
  const one = f => {
    const val = esc(obj[f.key]);
    let inner;
    if (f.type === 'select') { // 下拉型字段（如性别）
      inner = `<select data-s="${s}" ${idx} data-f="${f.key}">${f.options.map(o =>
        `<option value="${esc(o)}" ${String(obj[f.key] ?? '') === o ? 'selected' : ''}>${o || '请选择'}</option>`).join('')}</select>`;
    } else if (f.area) {
      inner = `<textarea data-s="${s}" ${idx} data-f="${f.key}" placeholder="${esc(f.ph || '')}">${val}</textarea>`;
    } else {
      inner = `<input data-s="${s}" ${idx} data-f="${f.key}" value="${val}" placeholder="${esc(f.ph || '')}">`;
    }
    // 长文本字段挂「AI 美化」按钮
    const aiBtn = f.ai ? `<button type="button" class="ai-btn" data-action="ai-polish" data-s="${s}" ${idx} data-f="${f.key}">${ICONS.spark}AI 美化</button>` : '';
    return `<div class="field"><label>${esc(f.label)}${aiBtn}</label>${inner}</div>`;
  };
  for (const f of fields) {
    if (f.half) { rowBuf.push(one(f)); if (rowBuf.length === 2) flush(); }
    else { flush(); html += one(f); }
  }
  flush();
  return html;
}

/* 表单输入即时生效（不重绘表单，避免输入失焦） */
function onFormInput(e) {
  const t = e.target;
  const d = t.dataset;
  // 自定义模块字段（按稳定 id 写入）
  if (d.c && d.cid) {
    const it = data.sections.custom.items.find(x => x.id === d.cid);
    if (!it) return;
    it[d.c] = t.value;
    scheduleSave(); renderPreview();
    if (d.c === 'title') { renderSectionNav(); renderModulePanel(); } // 标题改了，导航/面板名字跟着变
    return;
  }
  const { s, i, f } = d;
  if (!s || !f) return;
  const sec = data.sections[s];
  if (!sec) return;
  if (s === 'coreSkills' && f === 'gname') { // 技能分组名
    sec.groups[+d.g].name = t.value;
  } else if (i !== undefined) sec.items[+i][f] = t.value;
  else sec[f] = t.value;
  scheduleSave();
  renderPreview();
}

/* ---------- 编辑器：中栏模块管理面板 ----------
   核心模块（基本信息/教育/项目/实习工作/核心技能/自我评价）：只显隐 + 排序，无删除键
   自定义模块：可显隐 + 排序 + ✕ 直接删除（不设「已移除模块」） */
function renderModulePanel() {
  const order = data.sectionOrder;
  $('block-list').innerHTML = order.map((id, idx) => {
    const vis = secVisible(id);
    return `<li class="block-item ${vis ? '' : 'off'}">
      <span class="bname">${esc(moduleName(id))}</span>
      <button class="btn btn-mini icon-btn ${vis ? '' : 'is-off'}" data-action="sec-eye" data-id="${esc(id)}"
        title="${vis ? '点击隐藏' : '点击显示'}">${vis ? ICONS.eye : ICONS.eyeOff}</button>
      <button class="btn btn-mini" data-action="sec-up" data-i="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
      <button class="btn btn-mini" data-action="sec-down" data-i="${idx}" ${idx === order.length - 1 ? 'disabled' : ''}>↓</button>
      ${isCustomId(id) ? `<button class="btn btn-mini" data-action="custom-del" data-id="${esc(id)}" title="删除该模块">✕</button>` : ''}
    </li>`;
  }).join('');
}

/* ---------- 标题主题色调色盘（简历标题配色，与网站皮肤独立） ---------- */
function renderPalette() {
  const box = $('palette');
  if (!box) return;
  box.innerHTML = PALETTE.map(c =>
    `<button class="sw ${data.themeColor === c ? 'active' : ''}" data-action="color-pick" data-id="${c}"
       style="background:${c}" title="${c}"></button>`).join('');
}

/* ---------- 三栏拖拽换位（宽屏；顺序存 data.colOrder，窄屏由 CSS 强制固定顺序） ---------- */
function applyColOrder() {
  const map = { nav: 'col-nav', manage: 'col-manage', preview: 'col-preview' };
  (data.colOrder || ['nav', 'manage', 'preview']).forEach((key, idx) => { $(map[key]).style.order = idx + 1; });
}
function moveColumn(from, to) {
  const order = (data.colOrder || ['nav', 'manage', 'preview']).filter(x => x !== from);
  order.splice(order.indexOf(to), 0, from); // 插入到目标面板的位置
  data.colOrder = order;
  saveData(); applyColOrder();
  toast('面板布局已调整（刷新后保持）');
}
function bindColDnD() {
  document.querySelectorAll('.col-dragbar').forEach(bar => {
    bar.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', bar.dataset.col);
      e.dataTransfer.effectAllowed = 'move';
      bar.closest('.col').classList.add('dragging'); // 拖拽中源面板半透明
    });
    bar.addEventListener('dragend', () => {
      document.querySelectorAll('.col').forEach(c => c.classList.remove('dragging', 'drag-over'));
    });
  });
  for (const [elId, key] of [['col-nav', 'nav'], ['col-manage', 'manage'], ['col-preview', 'preview']]) {
    const col = $(elId);
    col.addEventListener('dragover', e => {
      e.preventDefault(); // 必须阻止默认行为才允许放置
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over'); // 虚线占位提示
    });
    col.addEventListener('dragleave', e => {
      if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); // 防止子元素间抖动
    });
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const from = e.dataTransfer.getData('text/plain');
      if (from && from !== key) moveColumn(from, key);
    });
  }
}

/* ---------- 预览：A4 实时渲染 ---------- */
function sectionEmpty(id) {
  if (id === 'basic') return false;
  if (isCustomId(id)) {
    const it = customItem(id);
    return !it || (!String(it.title).trim() && !String(it.text).trim());
  }
  const def = SECTION_DEFS[id], sec = data.sections[id];
  if (def.type === 'coreSkills') return sec.groups.every(g => !g.name.trim() && g.tags.length === 0);
  if (def.type === 'list') return sec.items.every(it => Object.values(it).every(v => !String(v).trim()));
  if (def.type === 'text') return !String(sec.text).trim();
  return false;
}

/* 页头：姓名 / 意向 / 联系方式 + 可选头像（头像居右）
   标签模式：每个字段带「电话：/ 邮箱：」前缀，HR 一眼可辨；紧凑模式则无前缀 */
function headerHtml() {
  const b = data.sections.basic;
  const labelMode = data.layout.contactMode !== 'compact';
  const lb = t => (labelMode ? `<i class="rp-lb">${t}</i>` : '');
  const pairs = [
    ['电话：', b.phone], ['邮箱：', b.email], ['所在地：', b.city], ['个人主页：', b.website]
  ].filter(([, v]) => String(v).trim());
  const contactsHtml = pairs.length
    ? pairs.map(([t, v]) => `<span>${lb(t)}${esc(v)}</span>`).join('')
    : (!String(b.name).trim() && !String(b.position).trim()
        ? '<span class="ph">电话 · 邮箱 · 所在地 · 个人主页</span>' : '');
  // 扩展信息（性别/年龄/民族/政治面貌/户籍）：填了才显示，未填不出现空标签
  const metas = [['性别：', b.gender], ['年龄：', b.age], ['民族：', b.nation], ['政治面貌：', b.political], ['户籍：', b.hukou]]
    .filter(([, v]) => String(v).trim());
  const metasHtml = metas.length
    ? `<div class="rp-contacts rp-metas">${metas.map(([t, v]) => `<span>${lb(t)}${esc(v)}</span>`).join('')}</div>` : '';
  const avatar = b.avatar ? `<img class="rp-avatar" src="${b.avatar}" alt="头像">` : '';
  return `<div class="rp-header ${avatar ? 'with-avatar' : ''}">
    <div class="rp-hinfo">
      <div class="rp-name">${b.name.trim() ? esc(b.name) : '<span class="ph">你的姓名</span>'}</div>
      <div class="rp-position">${lb('求职意向：')}${b.position.trim() ? esc(b.position) : '<span class="ph">求职意向</span>'}</div>
      ${contactsHtml ? `<div class="rp-contacts">${contactsHtml}</div>` : ''}
      ${metasHtml}
    </div>${avatar}
  </div>`;
}

const dateRange = it => [it.start, it.end].filter(v => String(v).trim()).map(esc).join(' ~ ');
const filled = (items, keys) => items.filter(it => keys.some(k => String(it[k]).trim()));
/* 区块标题统一结构：色块（清新模板用）+ 标题文字 + 装饰线（简洁模板用），均为真实元素 */
const secTitle = t => `<div class="rp-sec-title"><span class="rp-sec-sq"></span>${t}<span class="rp-sec-line"></span></div>`;

function sectionHtml(id) {
  if (!secVisible(id) || sectionEmpty(id)) return '';
  if (isCustomId(id)) {
    const it = customItem(id);
    return `<section class="rp-section">${secTitle(it.title.trim() ? esc(it.title) : '自定义区块')}
      <div class="rp-item"><div class="rp-item-desc">${esc(it.text)}</div></div></section>`;
  }
  const def = SECTION_DEFS[id], sec = data.sections[id];
  let body = '';
  if (id === 'coreSkills') {
    // 核心技能：分组名 + 简洁标签排（无进度条）
    body = sec.groups.filter(g => g.name.trim() || g.tags.length).map(g => `
      <div class="rp-skill-group">${g.name.trim() ? `<span class="rp-skill-gname">${esc(g.name)}</span>` : ''}${g.tags.map(t => `<span class="rp-tag">${esc(t)}</span>`).join('')}</div>`).join('');
  } else if (id === 'education') {
    body = filled(sec.items, ['school', 'major', 'degree', 'gpa', 'courses', 'honors', 'start', 'end']).map(it => `
      <div class="rp-item"><i class="rp-dot"></i>
        <div class="rp-item-head"><span class="rp-item-title">${esc(it.school)}</span><span class="rp-item-date">${dateRange(it)}</span></div>
        <div class="rp-item-sub">${[it.degree, it.major, it.gpa && `GPA ${it.gpa}`].filter(Boolean).map(esc).join(' · ')}</div>
        ${it.courses.trim() ? `<div class="rp-item-desc">主修课程：${esc(it.courses)}</div>` : ''}
        ${it.honors && it.honors.trim() ? `<div class="rp-item-desc">荣誉 / 证书：${esc(it.honors)}</div>` : ''}
      </div>`).join('');
  } else if (id === 'projects') {
    body = filled(sec.items, ['name', 'role', 'tech', 'desc', 'start', 'end']).map(it => `
      <div class="rp-item"><i class="rp-dot"></i>
        <div class="rp-item-head"><span class="rp-item-title">${esc(it.name)}</span><span class="rp-item-date">${dateRange(it)}</span></div>
        <div class="rp-item-sub">${[it.role, it.tech].filter(Boolean).map(esc).join(' · ')}</div>
        ${it.desc.trim() ? `<div class="rp-item-desc">${esc(it.desc)}</div>` : ''}
      </div>`).join('');
  } else if (id === 'work') {
    body = filled(sec.items, ['company', 'role', 'desc', 'start', 'end']).map(it => `
      <div class="rp-item"><i class="rp-dot"></i>
        <div class="rp-item-head"><span class="rp-item-title">${esc(it.company)}</span><span class="rp-item-date">${dateRange(it)}</span></div>
        <div class="rp-item-sub">${esc(it.role)}</div>
        ${it.desc.trim() ? `<div class="rp-item-desc">${esc(it.desc)}</div>` : ''}
      </div>`).join('');
  } else { // summary
    body = `<div class="rp-item"><div class="rp-item-desc">${esc(sec.text)}</div></div>`;
  }
  return `<section class="rp-section">${secTitle(esc(def.title))}${body}</section>`;
}

function renderPreview() {
  const p = preview();
  const tid = data.templateId;
  p.className = `resume-preview tpl-${tid} fs-${data.fontScale} ha-${data.layout.align} ta-${data.layout.titleAlign}`;
  p.style.setProperty('--resume-theme', data.themeColor);
  p.style.setProperty('--resume-font', (FONTS[data.font] || FONTS.system).stack);

  // 渲染顺序完全由 sectionOrder 驱动（用户手动排序优先）
  const renderOne = id => id === 'basic' ? (secVisible('basic') ? headerHtml() : '') : sectionHtml(id);
  const SIDE = SIDE_MAP[tid]; // 双栏模板：侧栏区块集合
  if (SIDE) {
    const side = data.sectionOrder.filter(id => SIDE.includes(id)).map(renderOne).join('');
    const main = data.sectionOrder.filter(id => !SIDE.includes(id)).map(renderOne).join('');
    p.innerHTML = `<div class="rp-layout"><aside class="rp-side">${side}</aside><main class="rp-main">${main}</main></div>`;
  } else {
    p.innerHTML = `<div class="rp-inner">${data.sectionOrder.map(renderOne).join('')}</div>`;
  }
  fitPreview();
}

function fitPreview() {
  const vp = $('preview-viewport'), p = preview();
  if (!vp || !p) return;
  const s = Math.min(1, vp.clientWidth / 794);
  p.style.transform = `scale(${s})`;
  vp.style.height = (p.scrollHeight * s) + 'px';
}

/* ---------- 空内容判断 ---------- */
function isResumeEmpty() {
  const b = data.sections.basic;
  const basicEmpty = ['name', 'position', 'phone', 'email', 'city', 'website'].every(k => !String(b[k]).trim());
  return basicEmpty && data.sectionOrder.filter(id => id !== 'basic').every(sectionEmpty);
}

/* 导出文件统一命名：姓名-求职意向-简历（未填则用「我的简历」），过滤非法字符 */
function fileBase() {
  const n = data.sections.basic.name.trim(), p = data.sections.basic.position.trim();
  const raw = n ? (p ? `${n}-${p}-简历` : `${n}-简历`) : '我的简历';
  return raw.replace(/[\\/:*?"<>|]/g, '');
}

/* ---------- 导出：PDF（打印） ---------- */
function exportPDF() {
  if (isResumeEmpty()) { toast('简历内容还是空的，先填写一些内容再导出吧', 'warn'); return; }
  toast('在打印对话框中选择「另存为 PDF」即可');
  setTimeout(() => window.print(), 300);
}
function enterPrintMode() {
  const p = preview();
  printPlaceholder = document.createComment('preview-slot');
  p.parentNode.insertBefore(printPlaceholder, p);
  document.body.appendChild(p);
  p.classList.add('print-mode');
  document.body.classList.add('print-mode');
  // 「另存为 PDF」的默认文件名取自 document.title
  printPlaceholder._oldTitle = document.title;
  document.title = fileBase();
}
function exitPrintMode() {
  const p = preview();
  if (printPlaceholder && printPlaceholder.parentNode) {
    printPlaceholder.parentNode.insertBefore(p, printPlaceholder);
    if (printPlaceholder._oldTitle) document.title = printPlaceholder._oldTitle; // 恢复原标题
    printPlaceholder.remove();
  }
  printPlaceholder = null;
  p.classList.remove('print-mode');
  document.body.classList.remove('print-mode');
  fitPreview();
}

/* ---------- 导出：PNG（html2canvas） ---------- */
async function exportPNG() {
  if (isResumeEmpty()) { toast('简历内容还是空的，先填写一些内容再导出吧', 'warn'); return; }
  if (typeof html2canvas === 'undefined') {
    toast('PNG 组件未加载（CDN 被拦截或离线），请联网并用本地服务器打开', 'warn');
    return;
  }
  const needShow = !document.body.classList.contains('show-preview')
    && getComputedStyle($('col-preview')).display === 'none';
  if (needShow) document.body.classList.add('show-preview');
  const p = preview();
  const oldTransform = p.style.transform;
  p.style.transform = 'none';
  showLoading('正在生成图片…'); // 可爱加载层
  await new Promise(r => setTimeout(r, 60));
  try {
    const canvas = await html2canvas(p, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const a = document.createElement('a');
    a.download = fileBase() + '.png'; // 姓名-求职意向-简历.png
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast('已导出 PNG');
  } catch (err) {
    console.error(err);
    toast('导出 PNG 失败，请重试', 'warn');
  } finally {
    hideLoading();
    p.style.transform = oldTransform;
    if (needShow) document.body.classList.remove('show-preview');
    fitPreview();
  }
}

/* ---------- 导出 / 导入：JSON 草稿备份 ---------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'resume_data_v1.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('已导出 JSON 备份');
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj || typeof obj !== 'object' || !obj.sections || typeof obj.sections !== 'object')
        throw new Error('invalid resume json');
      data = normalizeData(obj);
      saveData();
      applySkin(data.skin, { silent: true });
      refreshAll();
      toast('草稿已导入，界面已刷新');
    } catch (err) {
      toast('导入失败：这不是有效的简历草稿 JSON 文件', 'warn');
    }
  };
  reader.onerror = () => toast('文件读取失败，请重试', 'warn');
  reader.readAsText(file);
}
function refreshAll() {
  if (!data.sectionOrder.includes(currentSection)) currentSection = 'basic';
  renderSkinMenus(); syncTemplateSelect(); syncFontSelect(); syncLayoutControls();
  renderSectionNav(); renderForm(); renderModulePanel(); renderPalette(); renderPreview(); applyColOrder(); renderTemplateCards();
}

/* ---------- 导出：真正的 Word（.docx，本地 docx.js 生成，Word/WPS 可编辑） ---------- */
const WORD_FONTS = { system: 'Microsoft YaHei', yahei: 'Microsoft YaHei', hei: 'SimHei', song: 'SimSun', kai: 'KaiTi' };
async function exportWord() {
  if (isResumeEmpty()) { toast('简历内容还是空的，先填写一些内容再导出吧', 'warn'); return; }
  if (typeof docx === 'undefined') { toast('Word 组件未加载（assets/docx.umd.js 缺失）', 'warn'); return; }
  showLoading('正在生成 Word…');
  try {
    const blob = await buildDocx();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileBase() + '.docx';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('已导出 Word（.docx，文字可改、头像在右侧）');
  } catch (e) {
    console.error(e);
    toast('导出 Word 失败，请重试', 'warn');
  } finally {
    hideLoading();
  }
}
function dataUrlToBytes(u) { // base64 头像 → 字节数组（ImageRun 需要）
  const bin = atob(u.split(',')[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
async function buildDocx() {
  const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
          WidthType, AlignmentType, BorderStyle, TabStopType, VerticalAlign } = docx;
  const b = data.sections.basic;
  const theme = data.themeColor.replace('#', '');
  const font = WORD_FONTS[data.font] || 'Microsoft YaHei';
  const labelMode = data.layout.contactMode !== 'compact';
  const NO = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const T = (text, opts = {}) => new TextRun({ text, font, ...opts });
  const P = (children, opts = {}) => new Paragraph({ children, ...opts });
  const joinLine = pairs => pairs.filter(([, v]) => String(v).trim())
    .map(([t, v]) => (labelMode ? t : '') + v).join('    ');
  const rawDate = it => [it.start, it.end].filter(v => String(v).trim()).join(' ~ ');
  const kids = [];

  /* 页头：左信息 + 右头像（无边框表格，头像位置稳定、缩放不垮） */
  const headLeft = [
    P([T(b.name || '姓名', { bold: true, size: 44 })], { spacing: { after: 60 } }),
    P([T((labelMode ? '求职意向：' : '') + (b.position || ''), { color: theme, size: 24 })], { spacing: { after: 100 } })
  ];
  const contactLine = joinLine([['电话：', b.phone], ['邮箱：', b.email], ['所在地：', b.city], ['个人主页：', b.website]]);
  if (contactLine) headLeft.push(P([T(contactLine, { color: '5A6270', size: 19 })]));
  const metaLine = joinLine([['性别：', b.gender], ['年龄：', b.age], ['民族：', b.nation], ['政治面貌：', b.political], ['户籍：', b.hukou]]);
  if (metaLine) headLeft.push(P([T(metaLine, { color: '5A6270', size: 19 })], { spacing: { before: 40 } }));
  const headCells = [new TableCell({
    children: headLeft, width: { size: 78, type: WidthType.PERCENTAGE },
    borders: NO, verticalAlign: VerticalAlign.TOP
  })];
  if (b.avatar) {
    headCells.push(new TableCell({
      children: [new Paragraph({
        children: [new ImageRun({ data: dataUrlToBytes(b.avatar), transformation: { width: 70, height: 70 } })],
        alignment: AlignmentType.RIGHT
      })],
      width: { size: 22, type: WidthType.PERCENTAGE }, borders: NO, verticalAlign: VerticalAlign.TOP
    }));
  }
  kids.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NO, bottom: NO, left: NO, right: NO, insideHorizontal: NO, insideVertical: NO },
    rows: [new TableRow({ children: headCells })]
  }));

  /* 区块内容（含信息标签、所选字体、主题色标题） */
  const secH = t => P([T(t, { bold: true, size: 24, color: theme })], {
    border: { bottom: { color: theme, space: 2, value: 'single', size: 8 } },
    spacing: { before: 260, after: 120 }
  });
  const itemHead = (t, d2) => P([T(t, { bold: true, size: 21 }), T('\t' + d2, { color: '7A828F', size: 18 })],
    { tabStops: [{ type: TabStopType.RIGHT, position: 9000 }], spacing: { before: 120 } });
  const subP = s => s ? P([T(s, { color: '5A6270', size: 19 })]) : null;
  const descPs = s => String(s || '').split('\n').filter(x => x.trim())
    .map(x => P([T(x, { size: 20 })], { spacing: { after: 40 } }));
  const push = (...els) => els.forEach(e => e && kids.push(e));
  for (const id of data.sectionOrder) {
    if (id === 'basic' || !secVisible(id) || sectionEmpty(id)) continue;
    if (isCustomId(id)) {
      const it = customItem(id);
      push(secH(it.title.trim() || '未命名模块'), ...descPs(it.text));
      continue;
    }
    const sec = data.sections[id];
    if (id === 'summary') { push(secH('自我评价'), ...descPs(sec.text)); continue; }
    if (id === 'coreSkills') {
      push(secH('核心技能'));
      for (const g of sec.groups) {
        if (!g.name.trim() && !g.tags.length) continue;
        push(P([T(g.name.trim() ? g.name + '：' : '', { bold: true, size: 20 }), T(g.tags.join('、'), { size: 20 })],
          { spacing: { after: 60 } }));
      }
      continue;
    }
    push(secH(SECTION_DEFS[id].title));
    for (const it of sec.items) {
      if (id === 'education') {
        if (!filled([it], ['school', 'major', 'degree', 'gpa', 'courses', 'honors', 'start', 'end']).length) continue;
        push(itemHead(it.school || '学校', rawDate(it)),
          subP([it.degree, it.major, it.gpa && `GPA ${it.gpa}`].filter(Boolean).join(' · ')),
          ...(it.courses.trim() ? descPs('主修课程：' + it.courses) : []),
          ...(it.honors && it.honors.trim() ? descPs('荣誉 / 证书：' + it.honors) : []));
      } else if (id === 'projects') {
        if (!filled([it], ['name', 'role', 'tech', 'desc', 'start', 'end']).length) continue;
        push(itemHead(it.name || '项目', rawDate(it)),
          subP([it.role, it.tech].filter(Boolean).join(' · ')), ...descPs(it.desc));
      } else if (id === 'work') {
        if (!filled([it], ['company', 'role', 'desc', 'start', 'end']).length) continue;
        push(itemHead(it.company || '公司', rawDate(it)), subP(it.role), ...descPs(it.desc));
      }
    }
  }
  return Packer.toBlob(new Document({ sections: [{ children: kids }] }));
}

/* ---------- AI 功能（前端直连 Kimi API，key 仅存 localStorage） ---------- */
const AI_KEY = 'kimi_api_key';
const AI_URL = 'https://api.moonshot.cn/v1/chat/completions';
const AI_MODEL = 'moonshot-v1-8k';
let pendingPolish = null;  // 正在美化的字段定位 {s,i,f,c,cid}
let currentReport = null;  // 当前诊断报告

/* 统一调用入口：未填 key / 网络异常 / key 无效都给出友好提示并返回 null；支持 AbortSignal 取消 */
async function callKimi(messages, { signal } = {}) {
  const key = (localStorage.getItem(AI_KEY) || '').trim();
  if (!key) {
    toast('请先在 AI 设置里填写 Kimi API key', 'warn');
    openAiSettings();
    return null;
  }
  try {
    const resp = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.3 }),
      signal
    });
    if (!resp.ok) {
      toast(resp.status === 401 ? 'API key 无效，请在 AI 设置里检查' : `AI 请求失败（${resp.status}），请稍后重试`, 'warn');
      return null;
    }
    const j = await resp.json();
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim() || null;
  } catch (e) {
    if (e.name === 'AbortError') return { aborted: true }; // 用户主动取消，不报错
    toast('网络异常，无法连接 AI 服务（请检查网络）', 'warn');
    return null;
  }
}
function openAiSettings() {
  $('ai-key-input').value = localStorage.getItem(AI_KEY) || '';
  $('ai-settings-modal').classList.remove('hidden');
}

/* AI 美化：把要点润色为专业表述，结果经用户确认后填回 */
async function aiPolish(ctx) {
  if (!ctx.text || !ctx.text.trim()) { toast('先写一些要点，AI 才能帮你美化', 'warn'); return; }
  pendingPolish = ctx;
  showLoading('AI 正在美化…');
  const typeName = ctx.f === 'desc' ? '工作 / 项目描述' : (ctx.f === 'text' ? '自我评价' : '简历文本');
  const content = await callKimi([
    { role: 'system', content: '你是资深中文简历顾问。把用户给的简历要点润色为专业、精炼、符合中文简历习惯的表述；用要点式短句（每句一行），突出动作与成果；不虚构事实；只输出润色后的正文，不要任何解释。' },
    { role: 'user', content: `请美化这段${typeName}：\n${ctx.text}` }
  ]);
  hideLoading();
  if (!content || content.aborted) return;
  $('ai-result-text').value = content;
  $('ai-result-modal').classList.remove('hidden');
}
/* 采用 AI 结果：写回原字段 */
function applyAiResult() {
  const ctx = pendingPolish;
  if (!ctx) return;
  const val = $('ai-result-text').value;
  if (ctx.c && ctx.cid) {
    const it = data.sections.custom.items.find(x => x.id === ctx.cid);
    if (it) it[ctx.c] = val;
  } else if (ctx.i !== undefined && ctx.i >= 0) {
    data.sections[ctx.s].items[ctx.i][ctx.f] = val;
  } else {
    data.sections[ctx.s][ctx.f] = val;
  }
  saveData(); renderForm(); renderPreview();
  pendingPolish = null;
  $('ai-result-modal').classList.add('hidden');
  toast('已采用 AI 结果');
}

/* 把整份简历序列化为纯文本（供 AI 诊断） */
function serializeResume() {
  const b = data.sections.basic, L = [];
  L.push(`姓名:${b.name} 求职意向:${b.position} 电话:${b.phone} 邮箱:${b.email} 所在地:${b.city} 个人主页:${b.website}`);
  for (const id of data.sectionOrder) {
    if (id === 'basic' || !secVisible(id) || sectionEmpty(id)) continue;
    if (isCustomId(id)) {
      const it = customItem(id);
      L.push(`【${it.title || '自定义区块'}】\n${it.text}`);
      continue;
    }
    const sec = data.sections[id];
    if (id === 'summary') { L.push(`【自我评价】\n${sec.text}`); continue; }
    const rows = sec.items.map(it => Object.values(it).filter(v => String(v).trim()).join('，'));
    L.push(`【${SECTION_DEFS[id].title}】\n` + rows.join('\n'));
  }
  return L.join('\n');
}

/* AI 诊断：先设置 key（诊断入口内嵌设置，避免误触后空等），再开始；过程中可取消 */
let diagCtrl = null;
function openAiDiagnoseSetup() {
  $('ai-report-body').innerHTML = `
    <p class="ai-note">AI 将从 HR 视角为整份简历评分、给出分维度评分和逐条修改建议。<b>诊断需要先设置 Kimi API key</b>（仅保存在本地浏览器）。</p>
    <div class="field"><label>Kimi API key</label>
      <input type="password" id="ai-diag-key" placeholder="sk-xxxxxxxx" value="${esc(localStorage.getItem(AI_KEY) || '')}" autocomplete="off"></div>
    <p class="ai-note">没有 key？到 <a href="https://platform.moonshot.cn" target="_blank" rel="noopener">platform.moonshot.cn</a> 免费申请，粘贴到上面即可开始。</p>
    <button class="btn btn-primary" data-action="ai-diag-start">保存 key 并开始诊断</button>`;
  $('ai-report-modal').classList.remove('hidden');
}
async function runDiagnosis() {
  if (isResumeEmpty()) { toast('简历内容还是空的，先填写再诊断', 'warn'); return; }
  diagCtrl = new AbortController();
  $('ai-report-body').innerHTML = `
    <div class="ai-loading"><div class="ai-spinner"></div>
      <p>AI 正在诊断简历，通常需要几秒到十几秒…</p>
      <button class="btn" data-action="ai-diag-cancel">取消诊断</button></div>`;
  const content = await callKimi([
    { role: 'system', content: '你是资深 HR 与中文简历审阅专家。从 HR 视角诊断简历，只输出 JSON（不要 markdown 代码块、不要解释），格式：{"total":85,"dims":[{"name":"内容完整度","score":80,"reason":"扣分原因"},{"name":"专业度","score":80,"reason":"..."},{"name":"排版结构","score":80,"reason":"..."},{"name":"求职匹配度","score":80,"reason":"..."}],"issues":[{"section":"basic","where":"基本信息","problem":"具体问题","suggestion":"修改建议"}]}。必查高频扣分项：拼写/语法错误、时间线矛盾（结束早于开始）、信息缺失（电话/邮箱/求职意向）、措辞笼统（如只写"负责xx"）、篇幅与结构问题。每条 issue 的 section 从 basic/education/projects/work/summary 中选最相关的一个。' },
    { role: 'user', content: '请诊断这份简历：\n' + serializeResume() }
  ], { signal: diagCtrl.signal });
  diagCtrl = null;
  if (content && content.aborted) { openAiDiagnoseSetup(); toast('已取消诊断'); return; }
  if (!content) { openAiDiagnoseSetup(); return; } // callKimi 已给出失败提示
  let report = null;
  try {
    const m = content.match(/\{[\s\S]*\}/);
    report = JSON.parse(m[0]);
  } catch (e) { /* 落入下方统一提示 */ }
  if (!report || typeof report.total === 'undefined' || !Array.isArray(report.issues)) {
    toast('AI 返回格式异常，请重试', 'warn');
    openAiDiagnoseSetup();
    return;
  }
  if (!Array.isArray(report.dims)) report.dims = [];
  currentReport = report;
  renderAiReportBody();
}
function renderAiReportBody() {
  const r = currentReport;
  if (!r) return;
  $('ai-report-body').innerHTML = `
    <div class="ai-total"><b>${esc(String(r.total))}</b><span>分（满分 100）</span></div>
    ${r.dims.map(d => `<div class="ai-dim">
      <div class="dim-head"><span>${esc(d.name)}</span><b>${esc(String(d.score))}</b></div>
      <div class="dim-bar"><i style="width:${Math.max(0, Math.min(100, +d.score || 0))}%"></i></div>
      <div class="dim-reason">${esc(d.reason || '')}</div>
    </div>`).join('')}
    <h4 class="ai-issues-title">逐条问题与修改建议（${r.issues.length}）</h4>
    ${r.issues.length ? r.issues.map((it, idx) => `<div class="ai-issue">
      <div><span class="where">[${esc(it.where || it.section || '')}]</span>${esc(it.problem || '')}</div>
      <div class="sugg">建议：${esc(it.suggestion || '')}</div>
      <div class="ops">
        <button class="btn btn-mini" data-action="ai-issue-skip" data-i="${idx}">忽略</button>
        <button class="btn btn-mini btn-primary" data-action="ai-issue-apply" data-i="${idx}" data-sec="${esc(it.section || 'basic')}">采纳</button>
      </div>
    </div>`).join('') : '<p class="ai-note">所有问题都已处理，干得漂亮！</p>'}
    <div class="modal-actions" style="justify-content:flex-end;margin-top:12px">
      <button class="btn" data-action="ai-diagnose">重新诊断</button>
    </div>
  `;
}

/* ---------- 头像：选择图片 → 裁剪（拖动/缩放/实时预览）→ base64 存草稿 ---------- */
let crop = null;                 // 裁剪状态 {img, base, scale, dx, dy}
const CROP_SIZE = 280;           // 裁剪画布边长（预览用）

function handleAvatarFile(file) {
  if (!file || !file.type.startsWith('image/')) { toast('请选择图片文件', 'warn'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => openCropper(img); // 先进入裁剪界面，而不是直接压缩
    img.onerror = () => toast('图片读取失败，请重试', 'warn');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
/* 打开裁剪：初始缩放 = 铺满方形画布（cover），任何比例原图都不留白边 */
function openCropper(img) {
  const base = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
  crop = { img, base, scale: base, dx: 0, dy: 0 };
  $('crop-zoom').value = 100;
  $('avatar-crop-modal').classList.remove('hidden');
  drawCrop();
}
function drawCrop() {
  const cv = $('crop-canvas'), ctx = cv.getContext('2d');
  const { img, scale } = crop;
  const w = img.width * scale, h = img.height * scale;
  // clamp：图片始终盖住整个画布（防露白边 → 保证头像完整居中不裁顶）
  crop.dx = Math.min(0, Math.max(CROP_SIZE - w, crop.dx));
  crop.dy = Math.min(0, Math.max(CROP_SIZE - h, crop.dy));
  ctx.fillStyle = '#E9ECF1';
  ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
  ctx.drawImage(img, crop.dx, crop.dy, w, h);
}
/* 以画布中心为基准缩放，画面不跳 */
function setCropZoom(v) {
  v = Math.min(400, Math.max(100, v));
  $('crop-zoom').value = v;
  const old = crop.scale;
  crop.scale = crop.base * v / 100;
  crop.dx = CROP_SIZE / 2 - (CROP_SIZE / 2 - crop.dx) * (crop.scale / old);
  crop.dy = CROP_SIZE / 2 - (CROP_SIZE / 2 - crop.dy) * (crop.scale / old);
  drawCrop();
}
function bindCropper() {
  const cv = $('crop-canvas');
  let dragging = false, sx = 0, sy = 0;
  cv.addEventListener('pointerdown', e => { // 拖动移动（鼠标/触屏通用）
    dragging = true;
    sx = e.clientX - crop.dx; sy = e.clientY - crop.dy;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    crop.dx = e.clientX - sx; crop.dy = e.clientY - sy;
    drawCrop();
  });
  const stop = () => { dragging = false; };
  cv.addEventListener('pointerup', stop);
  cv.addEventListener('pointercancel', stop);
  cv.addEventListener('wheel', e => { // 滚轮缩放
    e.preventDefault();
    setCropZoom(+$('crop-zoom').value * (e.deltaY < 0 ? 1.06 : 0.94));
  }, { passive: false });
  $('crop-zoom').addEventListener('input', e => setCropZoom(+e.target.value));
}
/* 确认裁剪：把可视区输出为 240px 正方形 JPEG */
function confirmCrop() {
  const F = 240 / CROP_SIZE;
  const out = document.createElement('canvas');
  out.width = 240; out.height = 240;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 240, 240);
  ctx.drawImage(crop.img, crop.dx * F, crop.dy * F,
    crop.img.width * crop.scale * F, crop.img.height * crop.scale * F);
  const LIMIT = 200 * 1024 * 1.37; // base64 字符数 ≈ 字节数 × 1.37
  let q = 0.9, url = out.toDataURL('image/jpeg', q);
  while (url.length > LIMIT && q > 0.4) { q -= 0.15; url = out.toDataURL('image/jpeg', q); }
  if (url.length > LIMIT) { toast('图片太大，请换一张更小的照片', 'warn'); return; }
  data.sections.basic.avatar = url;
  saveData(); renderForm(); renderPreview();
  $('avatar-crop-modal').classList.add('hidden');
  crop = null;
  toast('头像已更新');
}
function cancelCrop() {
  $('avatar-crop-modal').classList.add('hidden');
  crop = null;
}

/* ---------- 预览 / 导出浮层 ---------- */
function openExportModal() {
  const box = $('export-preview-box');
  const clone = preview().cloneNode(true);
  clone.removeAttribute('id');
  box.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.appendChild(clone);
  box.appendChild(wrap);
  $('export-modal').classList.remove('hidden');
  requestAnimationFrame(() => {
    const s = Math.min(1, (box.clientWidth - 40) / 794);
    clone.style.transform = `scale(${s})`;
    clone.style.transformOrigin = 'top center';
    wrap.style.height = (clone.scrollHeight * s) + 'px';
  });
}
function closeExportModal() { $('export-modal').classList.add('hidden'); }

/* ---------- 全局事件（事件委托） ---------- */
function bindEvents() {
  document.addEventListener('click', e => {
    if (!e.target.closest('.skin-switcher'))
      document.querySelectorAll('.dropdown').forEach(dd => dd.classList.add('hidden'));

    const el = e.target.closest('[data-action]');
    if (!el) return;
    const act = el.dataset.action, id = el.dataset.id, i = el.dataset.i;

    switch (act) {
      case 'select-template': switchTemplate(id, true); break;
      case 'continue-edit':   showView('editor'); break;
      case 'back-home':       showView('home'); break;
      case 'guide-close':
        $('guide-banner').classList.add('hidden');
        localStorage.setItem(GUIDE_KEY, '1');
        break;
      case 'skin-menu': {
        const dd = el.parentElement.querySelector('.dropdown');
        const wasHidden = dd.classList.contains('hidden');
        document.querySelectorAll('.dropdown').forEach(d2 => d2.classList.add('hidden'));
        dd.classList.toggle('hidden', !wasHidden);
        break;
      }
      case 'skin-pick':
        applySkin(id);
        document.querySelectorAll('.dropdown').forEach(d2 => d2.classList.add('hidden'));
        break;
      case 'nav-pick':
        currentSection = id;
        renderSectionNav(); renderForm();
        break;
      case 'item-add': {
        const def = SECTION_DEFS[currentSection];
        if (!def || def.type !== 'list') break;
        data.sections[currentSection].items.push(def.newItem());
        saveData(); renderForm(); renderModulePanel(); renderPreview();
        break;
      }
      case 'item-del': {
        const def = SECTION_DEFS[currentSection];
        if (!def || def.type !== 'list') break;
        const items = data.sections[currentSection].items;
        items.splice(+i, 1);
        if (!items.length) items.push(def.newItem());
        saveData(); renderForm(); renderModulePanel(); renderPreview();
        break;
      }
      case 'item-up': case 'item-down': {
        const def = SECTION_DEFS[currentSection];
        if (!def || def.type !== 'list') break;
        const items = data.sections[currentSection].items;
        const j = +i + (act === 'item-up' ? -1 : 1);
        if (j < 0 || j >= items.length) break;
        [items[+i], items[j]] = [items[j], items[+i]];
        saveData(); renderForm(); renderPreview();
        break;
      }
      case 'sec-up': case 'sec-down': { // 模块排序：所有模块（含基本信息）都可自由移动
        const order = data.sectionOrder;
        const j = +i + (act === 'sec-up' ? -1 : 1);
        if (j < 0 || j >= order.length) break;
        [order[+i], order[j]] = [order[j], order[+i]];
        saveData(); renderModulePanel(); renderSectionNav(); renderPreview();
        break;
      }
      case 'sec-eye': { // 模块显隐
        const v = !secVisible(id);
        setSecVisible(id, v);
        saveData(); renderModulePanel(); renderPreview();
        toast(v ? `已显示「${moduleName(id)}」` : `已隐藏「${moduleName(id)}」，预览中不再显示`);
        break;
      }
      case 'mod-add-custom': { // 新增自定义模块
        const nid = genId();
        data.sections.custom.items.push({ id: nid, title: '', text: '', visible: true });
        const vid = 'custom:' + nid;
        data.sectionOrder.push(vid);
        currentSection = vid;
        saveData(); renderSectionNav(); renderForm(); renderModulePanel(); renderPreview();
        toast('已添加自定义模块，请在左侧填写标题和内容');
        break;
      }
      case 'custom-del': { // 永久删除自定义模块
        data.sections.custom.items = data.sections.custom.items.filter(it => ('custom:' + it.id) !== id);
        data.sectionOrder = data.sectionOrder.filter(x => x !== id);
        currentSection = 'basic';
        saveData(); renderSectionNav(); renderForm(); renderModulePanel(); renderPreview();
        toast('自定义模块已删除');
        break;
      }
      case 'cskill-group-add': // 核心技能：添加分组
        data.sections.coreSkills.groups.push(SECTION_DEFS.coreSkills.newGroup());
        saveData(); renderForm(); renderModulePanel(); renderPreview();
        break;
      case 'cskill-group-del': { // 删除分组（至少保留一个）
        const groups = data.sections.coreSkills.groups;
        if (groups.length <= 1) break;
        groups.splice(+el.dataset.g, 1);
        saveData(); renderForm(); renderModulePanel(); renderPreview();
        break;
      }
      case 'tag-del': // 删除技能关键词
        data.sections.coreSkills.groups[+el.dataset.g].tags.splice(+el.dataset.t, 1);
        saveData(); renderForm(); renderPreview();
        break;
      case 'color-pick': // 标题主题色
        data.themeColor = id;
        saveData(); renderPalette(); renderPreview();
        toast('标题主题色已更新');
        break;
      case 'avatar-upload': $('avatar-file').click(); break;
      case 'crop-ok': confirmCrop(); break;
      case 'crop-cancel': cancelCrop(); break;
      case 'avatar-tip-close': // 关闭头像规范提示（记住选择）
        localStorage.setItem('avatar_tip_closed', '1');
        el.closest('.avatar-tip').remove();
        break;
      case 'avatar-del':
        data.sections.basic.avatar = '';
        saveData(); renderForm(); renderPreview();
        toast('头像已删除');
        break;
      case 'reset-all':
        if (confirm('确定清空全部简历内容吗？此操作不可恢复。')) {
          const { skin, unlockedSkins } = data;
          data = defaultData();
          data.skin = skin; data.unlockedSkins = unlockedSkins;
          saveData(); currentSection = 'basic';
          refreshAll();
          toast('已清空，可以重新开始');
        }
        break;
      case 'open-export':  openExportModal(); break;
      case 'close-export': closeExportModal(); break;
      case 'modal-backdrop': if (e.target.classList.contains('modal')) e.target.classList.add('hidden'); break;
      case 'export-menu': { // 导出合并菜单（预览/PDF/PNG/Word/JSON）
        const dd = el.parentElement.querySelector('.dropdown');
        const wasHidden = dd.classList.contains('hidden');
        document.querySelectorAll('.dropdown').forEach(d2 => d2.classList.add('hidden'));
        dd.classList.toggle('hidden', !wasHidden);
        break;
      }
      case 'json-backup': { // 面板里的「备份 / 恢复」→ 展开头部导出菜单的备份项
        document.querySelectorAll('.dropdown').forEach(d2 => d2.classList.add('hidden'));
        const dd = document.querySelector('.export-switcher .dropdown');
        if (dd) dd.classList.remove('hidden');
        break;
      }
      case 'export-pdf': exportPDF(); break;
      case 'export-png': exportPNG(); break;
      case 'export-word': exportWord(); break;
      case 'export-json': exportJSON(); break;
      case 'import-json': $('import-file').click(); break;
      /* ---- AI 相关 ---- */
      case 'ai-settings': openAiSettings(); break;
      case 'ai-close': el.closest('.modal').classList.add('hidden'); break;
      case 'ai-key-save':
        localStorage.setItem(AI_KEY, $('ai-key-input').value.trim());
        $('ai-settings-modal').classList.add('hidden');
        toast('API key 已保存到本地浏览器');
        break;
      case 'ai-polish': { // 从按钮上的 data-* 定位要美化的字段
        const d2 = el.dataset;
        let text = '';
        if (d2.c && d2.cid) {
          const it = data.sections.custom.items.find(x => x.id === d2.cid);
          text = it ? it[d2.c] : '';
        } else if (d2.i !== undefined) {
          text = data.sections[d2.s].items[+d2.i][d2.f];
        } else {
          text = data.sections[d2.s][d2.f];
        }
        aiPolish({ s: d2.s, i: d2.i !== undefined ? +d2.i : -1, f: d2.f, c: d2.c, cid: d2.cid, text });
        break;
      }
      case 'ai-apply': applyAiResult(); break;
      case 'ai-cancel':
        pendingPolish = null;
        $('ai-result-modal').classList.add('hidden');
        toast('已保留原文');
        break;
      case 'ai-diagnose': openAiDiagnoseSetup(); break; // 打开诊断（先设置 key，再开始）
      case 'ai-diag-start': {
        const k = $('ai-diag-key').value.trim();
        if (!k) { toast('请先填写 Kimi API key', 'warn'); break; }
        localStorage.setItem(AI_KEY, k);
        runDiagnosis();
        break;
      }
      case 'ai-diag-cancel': if (diagCtrl) diagCtrl.abort(); break;
      case 'ai-issue-apply': { // 采纳：定位到相关区块去修改，并移除该条
        const sec = ['basic', 'education', 'projects', 'work', 'summary'].includes(el.dataset.sec) ? el.dataset.sec : 'basic';
        currentReport.issues.splice(+i, 1);
        renderAiReportBody();
        $('ai-report-modal').classList.add('hidden');
        showView('editor');
        currentSection = data.sectionOrder.includes(sec) ? sec : 'basic';
        renderSectionNav(); renderForm();
        toast(`已定位到「${SECTION_DEFS[sec].title}」，请按建议修改`);
        break;
      }
      case 'ai-issue-skip': // 忽略：仅从列表移除
        currentReport.issues.splice(+i, 1);
        renderAiReportBody();
        break;
      case 'toggle-preview': {
        document.body.classList.toggle('show-preview');
        const shown = document.body.classList.contains('show-preview');
        el.textContent = shown ? '关闭预览' : '预览';
        if (shown) fitPreview();
        break;
      }
    }
  });

  // 表单输入（input 覆盖文本框；change 覆盖下拉框）
  $('section-form').addEventListener('input', onFormInput);
  $('section-form').addEventListener('change', onFormInput);
  // 技能标签：回车添加关键词
  $('section-form').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('tag-input')) {
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      data.sections.coreSkills.groups[+e.target.dataset.g].tags.push(v);
      saveData(); renderForm(); renderModulePanel(); renderPreview();
    }
  });

  // 「对齐/显示」下拉（页头对齐 / 标题对齐 / 联系方式标签），立即生效并存草稿
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches && t.matches('select[data-layout]')) {
      data.layout[t.dataset.layout] = t.value;
      saveData(); renderPreview();
      const names = { align: '页头对齐', titleAlign: '标题对齐', contactMode: '联系方式显示' };
      toast(`${names[t.dataset.layout] || '设置'}已更新`);
    }
  });

  // 模板 / 字体下拉
  $('template-select').addEventListener('change', e => {
    data.templateId = e.target.value;
    saveData(); renderPreview(); renderTemplateCards();
    toast(`已切换到「${TEMPLATES[e.target.value].name}」模板，已填内容全部保留`);
  });
  $('font-select').addEventListener('change', e => {
    data.font = e.target.value;
    saveData(); renderPreview();
    toast(`简历字体已切换：${FONTS[e.target.value].name}`);
  });

  // 导入 JSON / 上传头像 文件框
  $('import-file').addEventListener('change', e => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
    e.target.value = '';
  });
  $('avatar-file').addEventListener('change', e => {
    if (e.target.files[0]) handleAvatarFile(e.target.files[0]);
    e.target.value = '';
  });

  window.addEventListener('resize', () => { fitPreview(); fitMinis(); });
  window.addEventListener('beforeprint', enterPrintMode);
  window.addEventListener('afterprint', exitPrintMode);
  bindColDnD(); // 三栏拖拽换位
  bindCropper(); // 头像裁剪（拖动/缩放）
}

/* ---------- 启动（带兜底：任何一步异常都不至于让整页交互瘫痪） ---------- */
function init() {
  if (!SKINS[data.skin] || !data.unlockedSkins.includes(data.skin)) data.skin = 'default';
  applySkin(data.skin, { silent: true });
  renderSkinMenus();
  syncTemplateSelect();
  syncFontSelect();
  syncLayoutControls();
  renderTemplateCards();
  renderPalette();
  applyColOrder();
  bindEvents();
  showView('home');
  if (!localStorage.getItem(GUIDE_KEY)) $('guide-banner').classList.remove('hidden');
  if (hadDraft) $('save-status').textContent = '草稿已恢复';
}
try {
  init();
} catch (e) {
  // 兜底：初始化失败也尽量保住基本交互，并提示用户强制刷新（正常情况不会触发）
  try { bindEvents(); showView('home'); } catch (_) { /* 已无能为力 */ }
  setTimeout(() => toast('页面初始化遇到问题，请按 Ctrl+F5 强制刷新一次', 'warn'), 400);
}
