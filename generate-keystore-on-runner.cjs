const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  console.log("Generating release keystore on the runner...");
  
  // Run keytool to generate the keystore file
  execSync('keytool -genkeypair -v -keystore release.keystore -alias trackify -keyalg RSA -keysize 2048 -validity 10000 -storepass "trackify_secret_key" -keypass "trackify_secret_key" -dname "CN=CupidShell, O=Trackify, C=US"', { stdio: 'inherit' });
  
  console.log("Keystore generated successfully!");

  const keystorePath = path.join(process.cwd(), 'release.keystore');
  if (fs.existsSync(keystorePath)) {
    const data = fs.readFileSync(keystorePath);
    const base64 = data.toString('base64');
    
    // Print the base64 string between markers in the log
    console.log("=== KEYSTORE_BASE64_START ===");
    console.log(base64);
    console.log("=== KEYSTORE_BASE64_END ===");
  } else {
    console.error("Keystore file not found at path: " + keystorePath);
  }
} catch (e) {
  console.error("Error in keystore generation script:", e.message || e);
}
