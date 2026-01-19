import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

// Extend dayjs with the required plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set the default timezone to 'Asia/Kolkata' (Indian Standard Time)
dayjs.tz.setDefault("Asia/Kolkata");

export const todayStartDate = () => {
  return dayjs().tz().startOf("day").toDate();
};

export const todayEndDate = () => {
  return dayjs().tz().endOf("day").toDate();
};

/**
 * Get current week start (Monday) and end (Sunday) dates
 */
export const getCurrentWeekDates = () => {
  const start = dayjs().tz().startOf("week").add(1, "day"); // Monday
  const end = dayjs().tz().endOf("week").add(1, "day"); // Sunday

  return {
    startDate: start.toDate(),
    endDate: end.toDate(),
  };
};

/**
 * Get last week start (Monday) and end (Sunday) dates
 */
export const getLastWeekDates = () => {
  const start = dayjs().tz().subtract(1, "week").startOf("week").add(1, "day"); // Last Monday
  const end = dayjs().tz().subtract(1, "week").endOf("week").add(1, "day"); // Last Sunday

  return {
    startDate: start.toDate(),
    endDate: end.toDate(),
  };
};
