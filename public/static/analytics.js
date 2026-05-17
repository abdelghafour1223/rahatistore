/* ==========================================================================
   نظام التتبع - Analytics System
   يُرسل البيانات إلى Google Sheets عبر Apps Script Webhook
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'mw_webhook_url';
  const SESSION_KEY = 'mw_session_id';
  const PAGE_LOAD_TIME = Date.now();

  // ===== أدوات مساعدة =====
  function getOrCreateSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function detectDevice() {
    const ua = navigator.userAgent || '';
    const w = window.innerWidth;
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function getWebhookUrl() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  // ===== مقاييس التمرير =====
  let maxScrollPercent = 0;

  function updateScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      maxScrollPercent = 100;
      return;
    }
    const scrolled = Math.min(100, Math.round((window.scrollY / docHeight) * 100));
    if (scrolled > maxScrollPercent) {
      maxScrollPercent = scrolled;
    }
  }

  // ===== مقاييس الجلسة =====
  let isPageVisible = !document.hidden;
  let activeTimeMs = 0;
  let lastActiveTick = Date.now();

  function tickActiveTime() {
    if (isPageVisible) {
      const now = Date.now();
      activeTimeMs += now - lastActiveTick;
      lastActiveTick = now;
    }
  }

  document.addEventListener('visibilitychange', function () {
    tickActiveTime();
    isPageVisible = !document.hidden;
    lastActiveTick = Date.now();
  });

  // تحديث الوقت النشط كل ثانية
  setInterval(tickActiveTime, 1000);

  // ===== أحداث التمرير (throttled) =====
  let scrollTimeout;
  window.addEventListener('scroll', function () {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function () {
      updateScroll();
      scrollTimeout = null;
    }, 150);
  }, { passive: true });

  updateScroll();

  // ===== إرسال البيانات =====
  function buildPayload(eventType) {
    tickActiveTime();
    updateScroll();
    return {
      type: 'analytics',
      event: eventType || 'pageview_end',
      sessionId: getOrCreateSessionId(),
      page: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer || 'direct',
      device: detectDevice(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      sessionDurationSec: Math.round(activeTimeMs / 1000),
      totalTimeSec: Math.round((Date.now() - PAGE_LOAD_TIME) / 1000),
      scrollDepth: maxScrollPercent,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  function sendBeacon(payload) {
    const url = getWebhookUrl();
    if (!url) return false;
    try {
      const data = JSON.stringify(payload);
      // استخدام no-cors لتجنب مشاكل Preflight مع Google Apps Script
      fetch(url, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        keepalive: true,
        mode: 'no-cors'
      }).catch(function () {});
      return true;
    } catch (e) {
      return false;
    }
  }

  // ===== Pageview Start (عند تحميل الصفحة) =====
  function sendPageviewStart() {
    const payload = buildPayload('pageview_start');
    sendBeacon(payload);
  }

  // ===== Pageview End (عند المغادرة) =====
  let endSent = false;
  function sendPageviewEnd() {
    if (endSent) return;
    endSent = true;
    const payload = buildPayload('pageview_end');
    sendBeacon(payload);
  }

  // إرسال "بداية الجلسة" مرة واحدة بعد تحميل الصفحة
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(sendPageviewStart, 100);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(sendPageviewStart, 100);
    });
  }

  // إرسال "نهاية الجلسة" عند مغادرة الصفحة
  window.addEventListener('pagehide', sendPageviewEnd);
  window.addEventListener('beforeunload', sendPageviewEnd);
  // احتياطي: إذا اختفت الصفحة (تبديل التبويب لفترة طويلة)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      // إرسال snapshot وسطي بدون قفل endSent
      const payload = buildPayload('visibility_hidden');
      sendBeacon(payload);
    }
  });

  // ===== واجهة عامة لتسجيل أحداث مخصصة (مثل تقديم الطلب) =====
  window.MWAnalytics = {
    track: function (eventName, extraData) {
      const payload = buildPayload(eventName || 'custom_event');
      if (extraData && typeof extraData === 'object') {
        Object.assign(payload, extraData);
      }
      return sendBeacon(payload);
    },
    getSessionId: getOrCreateSessionId,
    getMetrics: function () {
      tickActiveTime();
      return {
        sessionDurationSec: Math.round(activeTimeMs / 1000),
        scrollDepth: maxScrollPercent,
        device: detectDevice()
      };
    }
  };
})();
