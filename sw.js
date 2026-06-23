/* no-op service worker (prevents 404 from csTimer utillib registration) */
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("fetch",function(){});
