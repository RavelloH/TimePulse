import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiSearch, FiX } from 'react-icons/fi';
import { useTranslation } from '@/i18n/useTranslation';
import { AutoResizer, AutoTransition } from '@/components/ui';

type WorldClockPreset = {
  id: string;
  name: string;
  timezone: string;
  country: string;
  color: string;
};

type TimezoneOption = {
  timezone: string;
  city: string;
  country: string;
};

export type WorldClockSelection = {
  name: string;
  timezone: string;
  city: string;
  country: string;
  color: string;
  skipToColorStep: boolean;
};

type WorldClockSelectionModalProps = {
  onClose: () => void;
  onSelectWorldClock: (selection: WorldClockSelection) => void;
};

// 常用世界时钟预设
const popularWorldClocks: WorldClockPreset[] = [
  {
    id: 'beijing',
    name: '北京',
    timezone: 'Asia/Shanghai',
    country: '中国',
    color: '#FF0000', // 中国红
  },
  {
    id: 'tokyo',
    name: '东京',
    timezone: 'Asia/Tokyo',
    country: '日本',
    color: '#FF6B6B', // 樱花粉
  },
  {
    id: 'seoul',
    name: '首尔',
    timezone: 'Asia/Seoul',
    country: '韩国',
    color: '#4ECDC4', // 韩式蓝绿
  },
  {
    id: 'singapore',
    name: '新加坡',
    timezone: 'Asia/Singapore',
    country: '新加坡',
    color: '#FF4757', // 新加坡红
  },
  {
    id: 'bangkok',
    name: '曼谷',
    timezone: 'Asia/Bangkok',
    country: '泰国',
    color: '#FFD700', // 泰式金
  },
  {
    id: 'mumbai',
    name: '孟买',
    timezone: 'Asia/Kolkata',
    country: '印度',
    color: '#FF9500', // 印度橙
  },
  {
    id: 'dubai',
    name: '迪拜',
    timezone: 'Asia/Dubai',
    country: '阿联酋',
    color: '#00B894', // 阿拉伯绿
  },
  {
    id: 'moscow',
    name: '莫斯科',
    timezone: 'Europe/Moscow',
    country: '俄罗斯',
    color: '#0984E3', // 俄罗斯蓝
  },
  {
    id: 'london',
    name: '伦敦',
    timezone: 'Europe/London',
    country: '英国',
    color: '#8B4513', // 英式棕色（更鲜明）
  },
  {
    id: 'paris',
    name: '巴黎',
    timezone: 'Europe/Paris',
    country: '法国',
    color: '#6C5CE7', // 法式紫
  },
  {
    id: 'berlin',
    name: '柏林',
    timezone: 'Europe/Berlin',
    country: '德国',
    color: '#FD79A8', // 德式粉
  },
  {
    id: 'rome',
    name: '罗马',
    timezone: 'Europe/Rome',
    country: '意大利',
    color: '#00B894', // 意大利绿
  },
  {
    id: 'newyork',
    name: '纽约',
    timezone: 'America/New_York',
    country: '美国',
    color: '#0984E3', // 美式蓝
  },
  {
    id: 'losangeles',
    name: '洛杉矶',
    timezone: 'America/Los_Angeles',
    country: '美国',
    color: '#FDCB6E', // 加州金
  },
  {
    id: 'chicago',
    name: '芝加哥',
    timezone: 'America/Chicago',
    country: '美国',
    color: '#E17055', // 芝加哥红
  },
  {
    id: 'toronto',
    name: '多伦多',
    timezone: 'America/Toronto',
    country: '加拿大',
    color: '#FF0000', // 枫叶红
  },
  {
    id: 'vancouver',
    name: '温哥华',
    timezone: 'America/Vancouver',
    country: '加拿大',
    color: '#00B894', // 加拿大绿
  },
  {
    id: 'sydney',
    name: '悉尼',
    timezone: 'Australia/Sydney',
    country: '澳大利亚',
    color: '#0984E3', // 澳洲蓝
  },
  {
    id: 'melbourne',
    name: '墨尔本',
    timezone: 'Australia/Melbourne',
    country: '澳大利亚',
    color: '#6C5CE7', // 墨尔本紫
  },
  {
    id: 'auckland',
    name: '奥克兰',
    timezone: 'Pacific/Auckland',
    country: '新西兰',
    color: '#00CEC9', // 新西兰绿
  },
];

// 完整时区列表
const allTimezones: TimezoneOption[] = [
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

export default function WorldClockSelectionModal({
  onClose,
  onSelectWorldClock,
}: WorldClockSelectionModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  // 翻译城市名
  const getTranslatedCity = (city: string, timezone: string): string => {
    // 将时区转换为翻译键格式
    const key = `timezone.${timezone.replace(/\//g, '_').replace(/\-/g, '_')}`;
    return t(key, city);
  };

  // 翻译国家名
  const getTranslatedCountry = (country: string): string => {
    const countryKey = `country.${country}`;
    return t(countryKey, country);
  };

  // 过滤时区
  const filteredTimezones = allTimezones.filter((timezone) => {
    const translatedCity = getTranslatedCity(timezone.city, timezone.timezone);
    const translatedCountry = getTranslatedCountry(timezone.country);
    const searchLower = searchTerm.toLowerCase();

    return translatedCity.toLowerCase().includes(searchLower)
      || translatedCountry.toLowerCase().includes(searchLower)
      || timezone.city.toLowerCase().includes(searchLower)
      || timezone.country.toLowerCase().includes(searchLower)
      || timezone.timezone.toLowerCase().includes(searchLower);
  });

  // 处理选择常用世界时钟
  const handleSelectPopular = (worldClock: WorldClockPreset): void => {
    const translatedCity = getTranslatedCity(worldClock.name, worldClock.timezone);
    onSelectWorldClock({
      name: `${translatedCity}${t('timer.time', '时间')}`, // 默认名称，用户可以修改
      timezone: worldClock.timezone,
      city: translatedCity,
      country: getTranslatedCountry(worldClock.country),
      color: worldClock.color,
      // 不要直接跳到下一步，让用户可以修改名称
      skipToColorStep: false,
    });
  };

  // 处理选择自定义时区
  const handleSelectTimezone = (timezone: TimezoneOption): void => {
    // 随机选择一个颜色
    const colors = ['#1890FF', '#52C41A', '#722ED1', '#13C2C2', '#FA8C16', '#FAAD14', '#F759AB', '#FF7A45'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const translatedCity = getTranslatedCity(timezone.city, timezone.timezone);
    onSelectWorldClock({
      name: `${translatedCity}${t('timer.time', '时间')}`, // 默认名称，用户可以修改
      timezone: timezone.timezone,
      city: translatedCity,
      country: getTranslatedCountry(timezone.country),
      color: randomColor,
      // 不要直接跳到下一步，让用户可以修改名称
      skipToColorStep: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-2xl m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t('modal.addWorldClock.selectWorldClock', '选择世界时间')}</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <AutoResizer initial={false}>
        <AutoTransition transitionKey={showAll ? `worldclock-all-${filteredTimezones.length}` : 'worldclock-popular'} initial={false} type="crossFade">
        <>
        {!showAll && (
          <>
            <h3 className="text-lg font-medium mb-4">{t('modal.addWorldClock.popularCities', '常用城市')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 overflow-x-hidden">
              {popularWorldClocks.map((worldClock) => {
                const translatedCity = getTranslatedCity(worldClock.name, worldClock.timezone);
                const translatedCountry = getTranslatedCountry(worldClock.country);

                return (
                  <motion.button
                    key={worldClock.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 rounded-lg glass-card hover:bg-white/10 dark:hover:bg-black/10 transition-colors text-left min-w-0"
                    onClick={() => handleSelectPopular(worldClock)}
                    data-insightflare-event="worldclock_preset_select"
                    data-insightflare-event-timezone={worldClock.timezone}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${worldClock.color}20`, color: worldClock.color }}
                      >
                        <FiMapPin className="text-sm" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{translatedCity}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {translatedCountry}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => setShowAll(true)}
                data-insightflare-event="worldclock_view_all"
              >
                {t('modal.addWorldClock.viewMoreTimezones', '查看更多时区')}
              </button>
            </div>
          </>
        )}

        {showAll && (
          <>
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('modal.timezone.search', '搜索城市或国家...')}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto overflow-x-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredTimezones.map((timezone, index) => {
                  const translatedCity = getTranslatedCity(timezone.city, timezone.timezone);
                  const translatedCountry = getTranslatedCountry(timezone.country);

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors text-left min-w-0"
                      onClick={() => handleSelectTimezone(timezone)}
                      data-insightflare-event="timezone_select"
                      data-insightflare-event-timezone={timezone.timezone}
                    >
                      <div className="font-medium truncate">{translatedCity}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {translatedCountry} - {timezone.timezone}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowAll(false)}
              >
                {t('modal.addWorldClock.backToPopular', '返回常用城市')}
              </button>
            </div>
          </>
        )}
        </>
        </AutoTransition>
        </AutoResizer>

        <div className="mt-6 flex justify-end">
          <button
            className="btn-glass-secondary"
            onClick={onClose}
          >
            {t('common.cancel', '取消')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
