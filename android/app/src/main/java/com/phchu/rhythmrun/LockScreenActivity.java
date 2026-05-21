package com.phchu.rhythmrun;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class LockScreenActivity extends AppCompatActivity {

    public static final String ACTION_UPDATE_STATS = "com.phchu.rhythmrun.UPDATE_STATS";
    
    private TextView tvDistance;
    private TextView tvDuration;
    private TextView tvPace;
    private ImageView btnClose;

    private final BroadcastReceiver statsReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_UPDATE_STATS.equals(intent.getAction())) {
                String distance = intent.getStringExtra("distance");
                String duration = intent.getStringExtra("duration");
                String pace = intent.getStringExtra("pace");

                if (distance != null) tvDistance.setText(distance);
                if (duration != null) tvDuration.setText(duration);
                if (pace != null) tvPace.setText(pace);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Ensure the activity shows over the lock screen and turns the screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        
        // Keep screen on while this activity is visible
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_lock_screen);

        tvDistance = findViewById(R.id.tvDistance);
        tvDuration = findViewById(R.id.tvDuration);
        tvPace = findViewById(R.id.tvPace);
        btnClose = findViewById(R.id.btnClose);

        btnClose.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish(); // Close the overlay
            }
        });

        // Register receiver for updates
        IntentFilter filter = new IntentFilter(ACTION_UPDATE_STATS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(statsReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statsReceiver, filter);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(statsReceiver);
        } catch (Exception e) {
            // Ignore if not registered
        }
    }
}
