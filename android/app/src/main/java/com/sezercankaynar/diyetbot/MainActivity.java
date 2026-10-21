package com.sezercankaynar.diyetbot;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The app's own plugins: home-screen menu widget, device settings shortcuts.
        registerPlugin(MenuWidgetPlugin.class);
        registerPlugin(DeviceSettingsPlugin.class);
        super.onCreate(savedInstanceState);
        MenuWidgetPlugin.handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        MenuWidgetPlugin.handleIntent(intent);
    }
}
