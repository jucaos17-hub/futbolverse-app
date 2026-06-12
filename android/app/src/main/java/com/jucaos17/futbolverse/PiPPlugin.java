package com.jucaos17.futbolverse;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PiP")
public class PiPPlugin extends Plugin {

    @PluginMethod
    public void setVideoPlaying(PluginCall call) {
        Boolean playing = call.getBoolean("playing", false);
        ((MainActivity) getActivity()).setVideoPlaying(playing);
        call.resolve();
    }

    @PluginMethod
    public void enterPiP(PluginCall call) {
        ((MainActivity) getActivity()).enterPiP();
        call.resolve();
    }
}
