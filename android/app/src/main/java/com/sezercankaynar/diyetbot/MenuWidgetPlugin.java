package com.sezercankaynar.diyetbot;

import android.content.Context;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Receives the week's menu from the app (src/native/menuWidget.ts) and redraws the home-screen widget.
 * Also hands the app what a widget button asked for (e.g. "coach" → open the coach chat).
 */
@CapacitorPlugin(name = "MenuWidget")
public class MenuWidgetPlugin extends Plugin {
    static final String EXTRA_ACTION = "diyetbot_action";
    private static String pendingAction;
    private static MenuWidgetPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    /** Called by MainActivity for the launch intent and later ones (the activity is singleTask). */
    static void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra(EXTRA_ACTION);
        if (action == null) return;
        intent.removeExtra(EXTRA_ACTION);
        pendingAction = action;
        if (instance != null) instance.notifyListeners("action", new JSObject().put("action", action));
    }

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

    /** The widget button's request, once (null when there is none). */
    @PluginMethod
    public void takeAction(PluginCall call) {
        JSObject r = new JSObject();
        r.put("action", pendingAction);
        pendingAction = null;
        call.resolve(r);
    }
}
