package com.dingdong.medicine.common.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

public class ChinaTimeUtil {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static ZonedDateTime now() {
        return ZonedDateTime.now(ZONE);
    }

    public static String todayString() {
        return now().format(DATE_FMT);
    }

    public static String currentTimeString() {
        return now().format(TIME_FMT);
    }

    public static String nowString() {
        return now().format(DATETIME_FMT);
    }

    public static String dateString(ZonedDateTime dateTime) {
        return dateTime.format(DATE_FMT);
    }

    public static String timeString(ZonedDateTime dateTime) {
        return dateTime.format(TIME_FMT);
    }

    public static ZonedDateTime parseDate(String dateStr) {
        LocalDate date = LocalDate.parse(dateStr, DATE_FMT);
        return date.atStartOfDay(ZONE);
    }

    public static ZonedDateTime parseDateTime(String dateTimeStr) {
        LocalDateTime dateTime = LocalDateTime.parse(dateTimeStr, DATETIME_FMT);
        return dateTime.atZone(ZONE);
    }

    public static String weekStartString() {
        LocalDate today = now().toLocalDate();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return monday.format(DATE_FMT);
    }

    public static String weekEndString() {
        LocalDate today = now().toLocalDate();
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        return sunday.format(DATE_FMT);
    }

    public static int dayOfWeek() {
        return now().getDayOfWeek().getValue();
    }

    public static boolean isBefore(String time1, String time2) {
        LocalTime t1 = LocalTime.parse(time1, TIME_FMT);
        LocalTime t2 = LocalTime.parse(time2, TIME_FMT);
        return t1.isBefore(t2);
    }

    public static boolean isAfter(String time1, String time2) {
        LocalTime t1 = LocalTime.parse(time1, TIME_FMT);
        LocalTime t2 = LocalTime.parse(time2, TIME_FMT);
        return t1.isAfter(t2);
    }

    public static long minutesBetween(String time1, String time2) {
        LocalTime t1 = LocalTime.parse(time1, TIME_FMT);
        LocalTime t2 = LocalTime.parse(time2, TIME_FMT);
        return Duration.between(t1, t2).toMinutes();
    }

    public static String todayPlusDays(int days) {
        return now().toLocalDate().plusDays(days).format(DATE_FMT);
    }
}
