package com.cupidshell.trackify;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Clear caches and service worker data before super.onCreate initializes the WebView
        clearWebViewCacheAndServiceWorkers();
        
        super.onCreate(savedInstanceState);

        // Force WebView to load without cache for local packaged assets
        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void clearWebViewCacheAndServiceWorkers() {
        try {
            File appDataDir = getCacheDir().getParentFile();
            if (appDataDir != null) {
                File appWebviewDir = new File(appDataDir, "app_webview");
                if (appWebviewDir.exists()) {
                    deleteServiceWorkerDirectories(appWebviewDir);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void deleteServiceWorkerDirectories(File file) {
        if (file.isDirectory()) {
            String name = file.getName();
            if (name.equals("Service Worker") || name.equals("Cache") || name.equals("Code Cache")) {
                deleteDir(file);
            } else {
                File[] children = file.listFiles();
                if (children != null) {
                    for (File child : children) {
                        deleteServiceWorkerDirectories(child);
                    }
                }
            }
        }
    }

    private boolean deleteDir(File dir) {
        if (dir.isDirectory()) {
            String[] children = dir.list();
            if (children != null) {
                for (String child : children) {
                    boolean success = deleteDir(new File(dir, child));
                    if (!success) {
                        return false;
                    }
                }
            }
        }
        return dir.delete();
    }
}
