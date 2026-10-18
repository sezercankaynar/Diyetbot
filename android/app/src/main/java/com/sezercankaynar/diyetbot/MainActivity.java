package com.sezercankaynar.diyetbot;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The app's own plugin for the home-screen menu widget.
        registerPlugin(MenuWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
