import { dateTime, fullDate, initials, longDate, money, moneyShort, parseDollars, percent, relativeTime, shortDate } from "./format";

test("money in tables and forms", () => {
  expect(money(1_250_000)).toBe("US$12,500");
  expect(money(0)).toBe("US$0");
  expect(money(1_250_050)).toBe("US$12,500.50");
  expect(money(5)).toBe("US$0.05");
});

test("short money in charts, cards and summaries", () => {
  expect(moneyShort(1_250_000)).toBe("US$12.5K");
  expect(moneyShort(1_200_000)).toBe("US$12K");
  expect(moneyShort(120_000_000)).toBe("US$1.2M");
  expect(moneyShort(95_000)).toBe("US$950");
  expect(moneyShort(0)).toBe("US$0");
  expect(moneyShort(99_999_900)).toBe("US$1M");
});

test("parsing typed dollars", () => {
  expect(parseDollars("12,500")).toBe(1_250_000);
  expect(parseDollars("12500.5")).toBe(1_250_050);
  expect(parseDollars("US$9")).toBe(900);
  expect(parseDollars("0")).toBe(0);
  expect(parseDollars("")).toBeNull();
  expect(parseDollars("abc")).toBeNull();
  expect(parseDollars("-5")).toBeNull();
});

test("percentages", () => {
  expect(percent(50)).toBe("50%");
  expect(percent(0)).toBe("0%");
  expect(percent(33.4)).toBe("33%");
});

test("dates", () => {
  expect(longDate("2026-11-24")).toBe("24 Nov 2026");
  expect(fullDate("2026-11-24")).toBe("Tuesday 24 November 2026");
  expect(dateTime("2026-11-24T09:40:00")).toBe("24 Nov 2026, 09:40");
  const today = new Date(2026, 10, 24, 15, 0);
  expect(shortDate("2026-12-18", today)).toBe("18 Dec");
  expect(shortDate("2027-01-31", today)).toBe("31 Jan 2027");
  expect(relativeTime("2026-11-24T09:40:00", today)).toBe("Today, 09:40");
  expect(relativeTime("2026-11-23T18:00:00", today)).toBe("Yesterday");
  expect(relativeTime("2026-11-12T10:00:00", today)).toBe("12 Nov");
});

test("a date string is read as a local day, not shifted by time zone", () => {
  expect(longDate("2026-01-01")).toBe("1 Jan 2026");
});

test("initials", () => {
  expect(initials("Tara Nguyen")).toBe("TN");
  expect(initials("Dr. Priya Shah")).toBe("PS");
  expect(initials("Cher")).toBe("C");
  expect(initials(null)).toBe("—");
});
