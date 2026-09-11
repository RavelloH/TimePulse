declare module 'solarlunar' {
  interface SolarDate {
    cYear: number;
    cMonth: number;
    cDay: number;
  }

  interface SolarLunar {
    lunar2solar(year: number, month: number, day: number, isLeapMonth?: boolean): SolarDate | -1;
  }

  const solarlunar: SolarLunar;
  export default solarlunar;
}
