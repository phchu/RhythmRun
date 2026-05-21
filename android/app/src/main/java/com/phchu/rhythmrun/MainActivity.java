package com.phchu.rhythmrun;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "RhythmRun";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Log app start for Crashlytics custom key tracking
        try {
            Class<?> crashlytics = Class.forName("com.google.firebase.crashlytics.FirebaseCrashlytics");
            Object instance = crashlytics.getMethod("getInstance").invoke(null);

            // Set custom keys to help identify context when crash occurs
            crashlytics.getMethod("setCustomKey", String.class, String.class)
                    .invoke(instance, "app_version", "1.0");
            crashlytics.getMethod("setCustomKey", String.class, String.class)
                    .invoke(instance, "platform", "android");

            // Log a breadcrumb so we know the app started successfully
            crashlytics.getMethod("log", String.class)
                    .invoke(instance, "MainActivity.onCreate() called - app started");

            Log.i(TAG, "Crashlytics initialized successfully");
        } catch (ClassNotFoundException e) {
            // Crashlytics not available (no google-services.json) - this is fine
            Log.i(TAG, "Crashlytics not available (no google-services.json)");
        } catch (Exception e) {
            Log.w(TAG, "Crashlytics init failed: " + e.getMessage());
        }
    }
}
