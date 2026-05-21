const fs = require('fs');
const path = require('path');

const pluginFilePath = path.join(
  process.cwd(),
  'node_modules/capacitor-foreground-service/android/src/main/java/me/paschalis/capfgservice/CapacitorForegroundServicePlugin.java'
);

if (fs.existsSync(pluginFilePath)) {
  let content = fs.readFileSync(pluginFilePath, 'utf8');
  let updated = false;

  // Replace startService Intent target
  if (content.includes('new Intent(activity, CapacitorForegroundService.class)')) {
    content = content.replace(
      /new Intent\(activity,\s*CapacitorForegroundService\.class\)/g,
      'new Intent(activity, com.phchu.rhythmrun.RhythmRunForegroundService.class)'
    );
    updated = true;
  }

  // Double check any other CapacitorForegroundService.class references
  if (content.includes('Intent(activity,CapacitorForegroundService.class)')) {
    content = content.replace(
      /Intent\(activity,CapacitorForegroundService\.class\)/g,
      'Intent(activity, com.phchu.rhythmrun.RhythmRunForegroundService.class)'
    );
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(pluginFilePath, content, 'utf8');
    console.log('Successfully patched CapacitorForegroundServicePlugin.java');
  } else {
    console.log('CapacitorForegroundServicePlugin.java already patched or matching string not found');
  }
} else {
  console.warn('CapacitorForegroundServicePlugin.java not found at expected path:', pluginFilePath);
}
