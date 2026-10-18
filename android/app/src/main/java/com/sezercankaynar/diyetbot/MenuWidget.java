package com.sezercankaynar.diyetbot;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Home-screen widget: today's menu (meal times, plates, kcal, eaten ticks). The app sends the whole
 * week (MenuWidgetPlugin); the widget picks today's day itself, so it stays right after midnight.
 */
public class MenuWidget extends AppWidgetProvider {
    static final String PREFS = "diyetbot_widget";
    static final String KEY = "menu";
    private static final int[][] ROWS = {
        {R.id.row1, R.id.time1, R.id.title1, R.id.kcal1},
        {R.id.row2, R.id.time2, R.id.title2, R.id.kcal2},
        {R.id.row3, R.id.time3, R.id.title3, R.id.kcal3},
        {R.id.row4, R.id.time4, R.id.title4, R.id.kcal4},
        {R.id.row5, R.id.time5, R.id.title5, R.id.kcal5},
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, render(context));
    }

    /** Redraws every placed widget (called when the app sends new data). */
    static void refresh(Context context) {
        AppWidgetManager m = AppWidgetManager.getInstance(context);
        int[] ids = m.getAppWidgetIds(new ComponentName(context, MenuWidget.class));
        for (int id : ids) m.updateAppWidget(id, render(context));
    }

    private static RemoteViews render(Context context) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.menu_widget);
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        v.setOnClickPendingIntent(R.id.widget_root,
            PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        LocalDate today = LocalDate.now();
        v.setTextViewText(R.id.widget_date, today.format(DateTimeFormatter.ofPattern("d MMMM EEEE", new Locale("tr", "TR"))));
        JSONObject day = findDay(context, today.toString());
        for (int[] r : ROWS) v.setViewVisibility(r[0], View.GONE);
        if (day == null) {
            v.setTextViewText(R.id.widget_kcal, "");
            v.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            return v;
        }
        v.setViewVisibility(R.id.widget_empty, View.GONE);
        NumberFormat nf = NumberFormat.getIntegerInstance(new Locale("tr", "TR"));
        int target = day.optInt("target", 0);
        int menuKcal = 0;
        JSONArray meals = day.optJSONArray("meals");
        int n = meals == null ? 0 : Math.min(meals.length(), ROWS.length);
        for (int i = 0; i < n; i++) {
            JSONObject m = meals.optJSONObject(i);
            if (m == null) continue;
            int[] r = ROWS[i];
            boolean done = m.optBoolean("done", false);
            int kcal = m.optInt("kcal", 0);
            menuKcal += kcal;
            v.setViewVisibility(r[0], View.VISIBLE);
            v.setTextViewText(r[1], done ? "✓" : m.optString("time", ""));
            v.setTextViewText(r[2], m.optString("label", "") + " · " + m.optString("title", ""));
            v.setTextViewText(r[3], nf.format(kcal));
            int color = context.getColor(done ? R.color.widget_muted : R.color.widget_ink);
            v.setTextColor(r[2], color);
            v.setTextColor(r[3], color);
        }
        // Eaten so far vs the day's target; before anything is logged, the plan's total.
        if (day.has("eaten")) v.setTextViewText(R.id.widget_kcal, nf.format(day.optInt("eaten")) + " / " + nf.format(target) + " kcal");
        else v.setTextViewText(R.id.widget_kcal, "Menü " + nf.format(menuKcal) + " kcal");
        return v;
    }

    private static JSONObject findDay(Context context, String date) {
        String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
        if (raw == null) return null;
        try {
            JSONArray days = new JSONObject(raw).optJSONArray("days");
            if (days == null) return null;
            for (int i = 0; i < days.length(); i++) {
                JSONObject d = days.optJSONObject(i);
                if (d != null && date.equals(d.optString("date"))) return d;
            }
        } catch (Exception ignored) {
            // Bad data: show the "open the app" line.
        }
        return null;
    }
}
