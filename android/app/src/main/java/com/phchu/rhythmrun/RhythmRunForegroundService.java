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
                // Securely trigger the Notification Full-Screen Intent (FSI) from the background
                // by restarting/updating the foreground service with the current stats.
                // This forces Android to launch LockScreenActivity using FSI.
                Intent startIntent = new Intent(context, RhythmRunForegroundService.class);
                startIntent.setAction("start");
                startIntent.putExtra("distance", currentDistance);
                startIntent.putExtra("duration", currentDuration);
                startIntent.putExtra("pace", currentPace);
                startIntent.putExtra("title", "RhythmRun");
                startIntent.putExtra("description", "配速: " + currentPace + " | 距離: " + currentDistance + " km");
                
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(startIntent);
                    } else {
                        context.startService(startIntent);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to re-trigger FSI: " + e.getMessage());
                }
                
                // Immediately broadcast current stats to the active lock screen activity
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
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenReceiver, filter);
        }
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
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (Exception e) {
                // Ignore
            }
        }
        super.onDestroy();
    }

    private void sendStatsBroadcast(Context context) {
        Intent updateIntent = new Intent(LockScreenActivity.ACTION_UPDATE_STATS);
        updateIntent.putExtra("distance", currentDistance);
        updateIntent.putExtra("duration", currentDuration);
        updateIntent.putExtra("pace", currentPace);
        
        // Specify package to avoid security restrictions and target only our app
        updateIntent.setPackage(context.getPackageName());
        context.sendBroadcast(updateIntent);
    }
}
