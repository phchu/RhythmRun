package com.phchu.rhythmrun;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;
import me.paschalis.capfgservice.CapacitorForegroundService;

public class RhythmRunForegroundService extends CapacitorForegroundService {
    private static final String TAG = "RhythmRunFGService";
    
    private String currentDistance = "0.00";
    private String currentDuration = "00:00";
    private String currentPace = "--:--";

    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            Log.d(TAG, "Broadcast received: " + action);
            if (Intent.ACTION_SCREEN_OFF.equals(action) || Intent.ACTION_SCREEN_ON.equals(action)) {
                // Launch LockScreenActivity
                Intent lockIntent = new Intent(context, LockScreenActivity.class);
                lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_SINGLE_INSTANCE |
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                context.startActivity(lockIntent);
                
                // Immediately broadcast current stats to the newly launched activity
                sendStatsBroadcast(context);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "RhythmRunForegroundService created");
        
        // Register receiver for screen state changes
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenReceiver, filter);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String distance = intent.getStringExtra("distance");
            String duration = intent.getStringExtra("duration");
            String pace = intent.getStringExtra("pace");
            
            if (distance != null) currentDistance = distance;
            if (duration != null) currentDuration = duration;
            if (pace != null) currentPace = pace;
            
            Log.d(TAG, "Stats updated in service: " + currentDistance + ", " + currentDuration + ", " + currentPace);
            
            // Broadcast new stats to LockScreenActivity if it's active
            sendStatsBroadcast(this);
        }
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "RhythmRunForegroundService destroyed");
        try {
            unregisterReceiver(screenReceiver);
        } catch (Exception e) {
            // Ignore
        }
        super.onDestroy();
    }

    private void sendStatsBroadcast(Context context) {
        Intent updateIntent = new Intent(LockScreenActivity.ACTION_UPDATE_STATS);
        updateIntent.putExtra("distance", currentDistance);
        updateIntent.putExtra("duration", currentDuration);
        updateIntent.putExtra("pace", currentPace);
        
        // Since we registered LockScreenActivity receiver as non-exported,
        // we specify our application ID or set package to avoid security restrictions.
        updateIntent.setPackage(context.getPackageName());
        context.sendBroadcast(updateIntent);
    }
}
