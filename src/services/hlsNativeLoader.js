/**
 * Custom HLS.js Loader that bypasses CapacitorHttp interception.
 * 
 * CapacitorHttp patches window.fetch and window.XMLHttpRequest to route
 * all HTTP through the native Java layer. This works for JSON/text APIs
 * but BREAKS binary streaming (HLS .ts segments) because the native bridge
 * cannot handle arraybuffer responses properly.
 * 
 * Capacitor 5+ saves the originals as:
 *   - window.CapacitorWebXMLHttpRequest
 *   - window.CapacitorWebFetch
 * 
 * This loader uses those originals so HLS.js talks directly to the WebView
 * network stack, which handles binary streaming correctly.
 */

export function createNativeHlsLoader() {
  // Get the original (unpatched) XMLHttpRequest
  // Capacitor saves it before patching
  const OriginalXHR = window.CapacitorWebXMLHttpRequest || window.XMLHttpRequest;

  return class NativeXHRLoader {
    constructor(config) {
      this.xhrSetup = config ? config.xhrSetup : null;
      this.requestTimeout = config ? config.timeout : null;
      this.retryCount = 0;
      this.retryDelay = 0;
      this.config = config;
      this.stats = {
        aborted: false,
        loaded: 0,
        retry: 0,
        total: 0,
        chunkCount: 0,
        bwEstimate: 0,
        loading: { start: 0, first: 0, end: 0 },
        parsing: { start: 0, end: 0 },
        buffering: { start: 0, first: 0, end: 0 },
      };
      this.context = null;
      this.callbacks = null;
      this.loader = null;
    }

    destroy() {
      this.abort();
      this.loader = null;
    }

    abort() {
      if (this.loader && this.loader.readyState !== 4) {
        this.stats.aborted = true;
        this.loader.abort();
      }
      this.loader = null;
      this.callbacks = null;
    }

    load(context, config, callbacks) {
      this.context = context;
      this.callbacks = callbacks;
      this.stats.loading.start = self.performance.now();
      this.retryDelay = config.retryDelay;

      this._loadInternal();
    }

    _loadInternal() {
      const context = this.context;
      const config = this.config;
      const callbacks = this.callbacks;

      // Use the ORIGINAL (unpatched) XMLHttpRequest 
      const xhr = new OriginalXHR();
      this.loader = xhr;

      const stats = this.stats;
      stats.loading.first = 0;
      stats.loaded = 0;

      const xhrSetup = this.xhrSetup;

      try {
        if (xhrSetup) {
          try {
            xhrSetup(xhr, context.url);
          } catch (e) {
            // xhrSetup may have set up the xhr incorrectly, let's try opening it again
            xhr.open('GET', context.url, true);
          }
        }

        if (!xhr._opened) {
          xhr.open('GET', context.url, true);
        }
      } catch (e) {
        // IE11 throws InvalidStateError if xhr.open fails
        this.callbacks.onError(
          { code: xhr.status, text: e.message },
          context,
          xhr,
          stats
        );
        return;
      }

      if (context.rangeEnd) {
        xhr.setRequestHeader(
          'Range',
          'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1)
        );
      }

      xhr.onreadystatechange = this._readyStateChange.bind(this);
      xhr.onprogress = this._loadProgress.bind(this);

      xhr.responseType = context.responseType || '';

      // Set timeout
      if (this.requestTimeout) {
        xhr.timeout = this.requestTimeout;
      }
      xhr.ontimeout = () => {
        callbacks.onTimeout(stats, context, xhr);
      };

      xhr.onerror = () => {
        callbacks.onError(
          { code: xhr.status, text: xhr.statusText || 'XHR Error' },
          context,
          xhr,
          stats
        );
      };

      xhr.send();
    }

    _readyStateChange() {
      const xhr = this.loader;
      const context = this.context;
      const stats = this.stats;
      const callbacks = this.callbacks;

      if (!context || !xhr || !callbacks) return;

      if (xhr.readyState >= 2 && stats.loading.first === 0) {
        stats.loading.first = self.performance.now();
      }

      if (xhr.readyState === 4) {
        const status = xhr.status;
        // HTTP OK or partial content or cache
        if (status >= 200 && status < 300) {
          stats.loading.end = self.performance.now();

          let data;
          let len;

          if (xhr.responseType === 'arraybuffer') {
            data = xhr.response;
            len = data.byteLength;
          } else {
            data = xhr.responseText;
            len = data.length;
          }

          stats.loaded = stats.total = len;

          const response = {
            url: xhr.responseURL || context.url,
            data: data,
          };

          callbacks.onSuccess(response, stats, context, xhr);
        } else {
          // Retry logic
          if (
            stats.retry < (this.config ? this.config.maxRetry : 0) &&
            (status === 0 || (status >= 400 && status < 500))
          ) {
            stats.retry++;
            setTimeout(() => {
              this._loadInternal();
            }, this.retryDelay);
          } else {
            callbacks.onError(
              { code: status, text: xhr.statusText },
              context,
              xhr,
              stats
            );
          }
        }
      }
    }

    _loadProgress(event) {
      const stats = this.stats;

      stats.loaded = event.loaded;
      if (event.lengthComputable) {
        stats.total = event.total;
      }
    }
  };
}

/**
 * Returns true if we should use the custom native loader
 * (i.e., CapacitorHttp has patched XMLHttpRequest)
 */
export function shouldUseNativeLoader() {
  return !!window.CapacitorWebXMLHttpRequest;
}
