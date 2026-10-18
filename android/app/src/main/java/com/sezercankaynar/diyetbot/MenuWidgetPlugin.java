package com.sezercankaynar.diyetbot;

import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Receives the week's menu from the app (src/native/menuWidget.ts) and redraws the home-screen widget. */
@CapacitorPlugin(name = "MenuWidget")
public class MenuWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("data missing");
            return;
        }
        Context ctx = getContext();
        ctx.getSharedPreferences(MenuWidget.PREFS, Context.MODE_PRIVATE).edit().putString(MenuWidget.KEY, data).apply();
        MenuWidget.refresh(ctx);
        call.resolve(new JSObject());
    }
}
