package com.sezercankaynar.diyetbot;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Why reminders may not arrive, and shortcuts to fix it: the app's notification settings, its app
 * page (battery usage), and whether Android restricts it in the background.
 */
@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {
    @PluginMethod
    public void status(PluginCall call) {
        Context ctx = getContext();
        boolean restricted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            restricted = am != null && am.isBackgroundRestricted();
        }
        JSObject r = new JSObject();
        r.put("backgroundRestricted", restricted);
        r.put("manufacturer", Build.MANUFACTURER);
        call.resolve(r);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        start(call, i);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        start(call, i);
    }

    private void start(PluginCall call, Intent i) {
        try {
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Ayarlar açılamadı");
        }
    }
}
