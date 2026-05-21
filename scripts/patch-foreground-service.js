const fs = require('fs');
const path = require('path');

const pluginFilePath = path.join(
  process.cwd(),
  'node_modules/capacitor-foreground-service/android/src/main/java/me/paschalis/capfgservice/CapacitorForegroundServicePlugin.java'
);

if (fs.existsSync(pluginFilePath)) {
  let content = fs.readFileSync(pluginFilePath, 'utf8');
  let updated = false;

  // Replace startService and stopService Intent targets using Class.forName reflection to bypass compile-time dependency
  const targetPattern = /Intent intent = new Intent\(activity,\s*CapacitorForegroundService\.class\)/g;
  if (content.match(targetPattern) || content.includes('CapacitorForegroundService.class')) {
    content = content.replace(
      targetPattern,
      `Class<?> serviceClass;\n        try {\n            serviceClass = Class.forName("com.phchu.rhythmrun.RhythmRunForegroundService");\n        } catch (ClassNotFoundException e) {\n            serviceClass = CapacitorForegroundService.class;\n        }\n        Intent intent = new Intent(activity, serviceClass)`
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
