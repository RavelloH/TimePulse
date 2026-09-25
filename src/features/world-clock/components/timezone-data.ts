export type TimezoneOption = {
  timezone: string;
  city: string;
  country: string;
};

export type WorldClockPreset = {
  id: string;
  name: string;
  timezone: string;
  country: string;
  color: string;
};

export const popularWorldClocks: WorldClockPreset[] = [
  { id: 'beijing', name: '北京', timezone: 'Asia/Shanghai', country: '中国', color: '#FF0000' },
  { id: 'tokyo', name: '东京', timezone: 'Asia/Tokyo', country: '日本', color: '#FF6B6B' },
  { id: 'seoul', name: '首尔', timezone: 'Asia/Seoul', country: '韩国', color: '#4ECDC4' },
  { id: 'singapore', name: '新加坡', timezone: 'Asia/Singapore', country: '新加坡', color: '#FF4757' },
  { id: 'bangkok', name: '曼谷', timezone: 'Asia/Bangkok', country: '泰国', color: '#FFD700' },
  { id: 'mumbai', name: '孟买', timezone: 'Asia/Kolkata', country: '印度', color: '#FF9500' },
  { id: 'dubai', name: '迪拜', timezone: 'Asia/Dubai', country: '阿联酋', color: '#00B894' },
  { id: 'moscow', name: '莫斯科', timezone: 'Europe/Moscow', country: '俄罗斯', color: '#0984E3' },
  { id: 'london', name: '伦敦', timezone: 'Europe/London', country: '英国', color: '#8B4513' },
  { id: 'paris', name: '巴黎', timezone: 'Europe/Paris', country: '法国', color: '#6C5CE7' },
  { id: 'berlin', name: '柏林', timezone: 'Europe/Berlin', country: '德国', color: '#FD79A8' },
  { id: 'rome', name: '罗马', timezone: 'Europe/Rome', country: '意大利', color: '#00B894' },
  { id: 'newyork', name: '纽约', timezone: 'America/New_York', country: '美国', color: '#0984E3' },
  { id: 'losangeles', name: '洛杉矶', timezone: 'America/Los_Angeles', country: '美国', color: '#FDCB6E' },
  { id: 'chicago', name: '芝加哥', timezone: 'America/Chicago', country: '美国', color: '#E17055' },
  { id: 'toronto', name: '多伦多', timezone: 'America/Toronto', country: '加拿大', color: '#FF0000' },
  { id: 'vancouver', name: '温哥华', timezone: 'America/Vancouver', country: '加拿大', color: '#00B894' },
  { id: 'sydney', name: '悉尼', timezone: 'Australia/Sydney', country: '澳大利亚', color: '#0984E3' },
  { id: 'melbourne', name: '墨尔本', timezone: 'Australia/Melbourne', country: '澳大利亚', color: '#6C5CE7' },
  { id: 'auckland', name: '奥克兰', timezone: 'Pacific/Auckland', country: '新西兰', color: '#00CEC9' },
];

export const allTimezones: TimezoneOption[] = [
  // 亚洲
  { timezone: 'Asia/Shanghai', city: '上海', country: '中国' },
  { timezone: 'Asia/Hong_Kong', city: '香港', country: '中国' },
  { timezone: 'Asia/Taipei', city: '台北', country: '台湾' },
  { timezone: 'Asia/Tokyo', city: '东京', country: '日本' },
  { timezone: 'Asia/Seoul', city: '首尔', country: '韩国' },
  { timezone: 'Asia/Singapore', city: '新加坡', country: '新加坡' },
  { timezone: 'Asia/Bangkok', city: '曼谷', country: '泰国' },
  { timezone: 'Asia/Kuala_Lumpur', city: '吉隆坡', country: '马来西亚' },
  { timezone: 'Asia/Jakarta', city: '雅加达', country: '印尼' },
  { timezone: 'Asia/Manila', city: '马尼拉', country: '菲律宾' },
  { timezone: 'Asia/Kolkata', city: '新德里', country: '印度' },
  { timezone: 'Asia/Dubai', city: '迪拜', country: '阿联酋' },
  { timezone: 'Asia/Riyadh', city: '利雅得', country: '沙特' },
  { timezone: 'Asia/Tehran', city: '德黑兰', country: '伊朗' },
  { timezone: 'Asia/Tashkent', city: '塔什干', country: '乌兹别克斯坦' },
  // 欧洲
  { timezone: 'Europe/London', city: '伦敦', country: '英国' },
  { timezone: 'Europe/Paris', city: '巴黎', country: '法国' },
  { timezone: 'Europe/Berlin', city: '柏林', country: '德国' },
  { timezone: 'Europe/Rome', city: '罗马', country: '意大利' },
  { timezone: 'Europe/Madrid', city: '马德里', country: '西班牙' },
  { timezone: 'Europe/Amsterdam', city: '阿姆斯特丹', country: '荷兰' },
  { timezone: 'Europe/Brussels', city: '布鲁塞尔', country: '比利时' },
  { timezone: 'Europe/Vienna', city: '维也纳', country: '奥地利' },
  { timezone: 'Europe/Zurich', city: '苏黎世', country: '瑞士' },
  { timezone: 'Europe/Stockholm', city: '斯德哥尔摩', country: '瑞典' },
  { timezone: 'Europe/Oslo', city: '奥斯陆', country: '挪威' },
  { timezone: 'Europe/Helsinki', city: '赫尔辛基', country: '芬兰' },
  { timezone: 'Europe/Moscow', city: '莫斯科', country: '俄罗斯' },
  { timezone: 'Europe/Athens', city: '雅典', country: '希腊' },
  { timezone: 'Europe/Istanbul', city: '伊斯坦布尔', country: '土耳其' },
  // 北美洲
  { timezone: 'America/New_York', city: '纽约', country: '美国' },
  { timezone: 'America/Los_Angeles', city: '洛杉矶', country: '美国' },
  { timezone: 'America/Chicago', city: '芝加哥', country: '美国' },
  { timezone: 'America/Denver', city: '丹佛', country: '美国' },
  { timezone: 'America/Phoenix', city: '凤凰城', country: '美国' },
  { timezone: 'America/Anchorage', city: '安克雷奇', country: '美国' },
  { timezone: 'Pacific/Honolulu', city: '火奴鲁鲁', country: '美国' },
  { timezone: 'America/Toronto', city: '多伦多', country: '加拿大' },
  { timezone: 'America/Vancouver', city: '温哥华', country: '加拿大' },
  { timezone: 'America/Mexico_City', city: '墨西哥城', country: '墨西哥' },
  // 南美洲
  { timezone: 'America/Sao_Paulo', city: '圣保罗', country: '巴西' },
  { timezone: 'America/Argentina/Buenos_Aires', city: '布宜诺斯艾利斯', country: '阿根廷' },
  { timezone: 'America/Lima', city: '利马', country: '秘鲁' },
  { timezone: 'America/Bogota', city: '波哥大', country: '哥伦比亚' },
  { timezone: 'America/Caracas', city: '加拉加斯', country: '委内瑞拉' },
  // 大洋洲
  { timezone: 'Australia/Sydney', city: '悉尼', country: '澳大利亚' },
  { timezone: 'Australia/Melbourne', city: '墨尔本', country: '澳大利亚' },
  { timezone: 'Australia/Perth', city: '珀斯', country: '澳大利亚' },
  { timezone: 'Pacific/Auckland', city: '奥克兰', country: '新西兰' },
  { timezone: 'Pacific/Fiji', city: '苏瓦', country: '斐济' },
  // 非洲
  { timezone: 'Africa/Cairo', city: '开罗', country: '埃及' },
  { timezone: 'Africa/Johannesburg', city: '约翰内斯堡', country: '南非' },
  { timezone: 'Africa/Lagos', city: '拉各斯', country: '尼日利亚' },
  { timezone: 'Africa/Nairobi', city: '内罗毕', country: '肯尼亚' },
  { timezone: 'Africa/Casablanca', city: '卡萨布兰卡', country: '摩洛哥' },
];

export const timezoneAccentPalette = [
  '#1890FF', '#52C41A', '#722ED1', '#13C2C2',
  '#FA8C16', '#FAAD14', '#F759AB', '#FF7A45',
] as const;

const popularTimezoneColors = new Map(
  popularWorldClocks.map(({ timezone, color }) => [timezone, color]),
);

export function getTimezoneAccentColor(timezone: string): string {
  const popularColor = popularTimezoneColors.get(timezone);
  if (popularColor) return popularColor;

  let hash = 0x811c9dc5;
  for (let index = 0; index < timezone.length; index += 1) {
    hash ^= timezone.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return timezoneAccentPalette[(hash >>> 0) % timezoneAccentPalette.length];
}
