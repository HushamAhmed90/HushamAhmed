// Generates the Android (TWA) project for Google Play from the live web manifest.
// Used by .github/workflows/android.yml. Signing happens later in the workflow.
import { TwaManifest, TwaGenerator, ConsoleLog } from '@bubblewrap/core';

const HOST = 'husham-ahmed.vercel.app';
const out = process.argv[2] || 'twa';
const versionCode = parseInt(process.env.VERSION_CODE, 10);
const versionName = process.env.VERSION_NAME;
if (!versionCode || !versionName) throw new Error('VERSION_CODE and VERSION_NAME are required');

const log = new ConsoleLog('twa');
const m = await TwaManifest.fromWebManifest(process.env.MANIFEST_URL || `https://${HOST}/manifest.webmanifest`);
m.packageId = 'com.hushamahmed.bitaqa';
m.host = HOST;
m.name = 'هشام للمعاملات';
m.launcherName = 'هشام للمعاملات';
m.startUrl = '/';
m.themeColor = m.themeColor; // from manifest (#173F5F)
m.navigationColor = m.themeColor;
m.navigationColorDark = m.themeColor;
m.navigationDividerColor = m.themeColor;
m.navigationDividerColorDark = m.themeColor;
m.enableNotifications = true;
m.enableSiteSettingsShortcut = true;
m.fallbackType = 'customtabs';
m.appVersionCode = versionCode;
m.appVersionName = versionName;
m.signingKey = { path: '../android.keystore', alias: process.env.KEY_ALIAS || 'my-key-alias' };
m.generatorApp = 'bubblewrap-ci';
m.minSdkVersion = 24; // androidbrowserhelper 2.7+ needs API 24 (Android 7)

const errors = m.validate();
if (errors) throw new Error('Invalid TWA manifest: ' + errors);
await new TwaGenerator().createTwaProject(out, m, log);
await m.saveToFile(`${out}/twa-manifest.json`);
console.log(`Generated ${m.packageId} v${versionName} (${versionCode}) in ${out}`);
