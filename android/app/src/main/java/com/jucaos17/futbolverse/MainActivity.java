package com.jucaos17.futbolverse;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onPause() {
        super.onPause();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().onResume();
            bridge.getWebView().resumeTimers();
        }
    }
}
