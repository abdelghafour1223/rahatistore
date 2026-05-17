# متجر راحتي - نظام صفحات هبوط متكامل

## نظرة عامة

نظام صفحات هبوط احترافي متكامل للسوق المغربي، مصمّم لبيع حزام تخفيف آلام الدورة الشهرية بالحرارة والتدليك. النظام مبني بـ HTML/CSS/JS خالص (بدون مكتبات خارجية ثقيلة) ويدعم RTL بالكامل مع خط Tajawal العربي الاحترافي.

- **الاسم**: راحتي (Rahati Store)
- **السوق المستهدف**: المغرب 🇲🇦
- **طريقة الدفع**: الدفع عند الاستلام (COD)
- **منصة النشر**: Cloudflare Pages

---

## الصفحات والمسارات

| المسار | الوصف |
|--------|-------|
| `/` | صفحة المنتج الرئيسية (Landing Page) |
| `/admin/` | لوحة الإدارة (محمية بكلمة سر) |
| `/thankyou/?...` | صفحة الشكر مع ملخص الطلب |
| `/static/styles.css` | ملف التصميم الرئيسي |
| `/static/analytics.js` | نظام التتبع |
| `/api/health` | فحص حالة الخدمة (JSON) |
| `/api/info` | معلومات الـ API |

### معلمات صفحة الشكر (URL params)
- `name` — اسم العميلة
- `phone` — رقم الهاتف
- `qty` — الكمية
- `total` — المبلغ الإجمالي بالدرهم
- `city` — المدينة

مثال:
```
/thankyou/?name=فاطمة&phone=0612345678&qty=2&total=598&city=الدار البيضاء
```

---

## المزايا المُنفّذة

### ① صفحة المنتج (`/`)
- **معرض صور تفاعلي**: 3 صور مع شريط سحب أفقي على الجوال (scroll-snap) ونقاط ملاحة، وشبكة ثلاثية على الديسكتوب.
- **معلومات المنتج**: اسم المنتج، تقييم النجوم، السعر الحالي (299 درهم) والأصلي (449 درهم) مع شارة خصم 33%.
- **نموذج طلب كامل**:
  - الاسم الكامل (مع تحقق ≥ 3 أحرف)
  - العنوان (مع تحقق ≥ 10 أحرف)
  - رقم الهاتف (تحقق Regex للأرقام المغربية 05/06/07)
  - محدد الكمية بأزرار `−` / رقم / `+` (1-10)
  - ملخص تلقائي للسعر يتحدث حسب الكمية
  - زر طلب مع spinner أثناء الإرسال
- **قسم المزايا**: 6 بطاقات تفاعلية (حرارة، تدليك، بطارية، خفيف، حزام مرن، علبة هدية)
- **قسم "لماذا تختارنا"**: 6 نقاط ثقة (الدفع عند الاستلام، التوصيل، الضمان، خدمة العملاء، آلاف الزبونات، إرجاع 7 أيام)
- **شريط CTA لاصق** على الجوال يظهر عند التمرير

### ② صفحة الإدارة (`/admin/`)
- **حماية بكلمة سر**: `admin2026` (افتراضي - يمكن تغييرها من ملف admin/index.html)
- **3 تبويبات**:
  1. **إعداد Apps Script**: السكريبت الجاهز للنسخ + 9 خطوات نشر تفصيلية
  2. **Webhook**: حقل لإدخال الرابط، زر حفظ، زر اختبار اتصال مع نتيجة فورية
  3. **لوحة تحليلات**: إحصائيات محلية + رسم بياني لتوزيع الأجهزة + جدول آخر الجلسات
- **اختبار الاتصال**: يرسل GET request للـ webhook ويُبلّغ بالنتيجة (نجاح/فشل) خلال ثوانٍ.

### ③ نظام التتبع (Analytics)
يُسجّل ويُرسل إلى Google Sheets عبر Beacon API:
- **عدد الزوار**: حدث `pageview_start` عند تحميل كل صفحة
- **مدة الجلسة**: حساب الوقت النشط بدقّة (يتوقف عند `visibilitychange`)
- **نسبة التمرير**: تتبع `maxScrollPercent` بـ throttling
- **نوع الجهاز**: mobile / tablet / desktop (User-Agent + viewport width)
- **معلومات إضافية**: المصدر (referrer)، اللغة، أبعاد الشاشة، session ID

**الإرسال**: `navigator.sendBeacon()` عند:
- تحميل الصفحة (`pageview_start`)
- مغادرتها (`pagehide` + `beforeunload`)
- إخفائها (`visibilitychange`)
- تقديم طلب (`order_submit`)

### ④ صفحة الشكر (`/thankyou/`)
- علامة صح متحركة (SVG draw animation)
- كونفيتي احتفالي (60 قطعة بألوان مختلفة)
- ملخص الطلب من URL params: المنتج، الكمية، الهاتف، المدينة، الإجمالي
- وقت التسليم المتوقع (بين تاريخ +1 يوم و +3 أيام، بأسماء الأشهر الدارجة المغربية)
- 3 خطوات تالية واضحة للعميلة
- روابط: متابعة التسوق + اتصل بنا
- **يحترم `prefers-reduced-motion`**: يُلغي كل الانيميشن للمستخدمين الذين يفضّلون ذلك

---

## بنية البيانات (Google Sheets)

عند الربط بـ Apps Script، تُنشأ ورقتان تلقائياً:

### ورقة "الطلبات"
| عمود | النوع |
|------|------|
| التاريخ | DateTime |
| الاسم الكامل | String |
| الهاتف | String |
| العنوان | String |
| المنتج | String |
| الكمية | Number |
| سعر الوحدة | Number |
| الإجمالي | Number |
| الجهاز | String (mobile/desktop/tablet) |
| معرّف الجلسة | String |
| الصفحة | URL |

### ورقة "التحليلات"
| عمود | النوع |
|------|------|
| التاريخ | DateTime |
| الحدث | String (pageview_start/pageview_end/visibility_hidden/order_submit/...) |
| معرّف الجلسة | String |
| الصفحة | String |
| الجهاز | String |
| مدة الجلسة (ث) | Number |
| نسبة التمرير % | Number |
| عرض الشاشة | Number |
| المصدر | String |
| اللغة | String |
| User Agent | String |

### التخزين المحلي (المتصفح)
- `localStorage.mw_webhook_url` — رابط Apps Script (يُحفظ من تبويب Webhook)
- `localStorage.mw_local_stats` — إحصائيات محلية للوحة التحكم
- `sessionStorage.mw_session_id` — معرّف الجلسة الحالي
- `sessionStorage.mw_admin_auth` — حالة تسجيل دخول الإدارة (صالحة 4 ساعات)

---

## التقنيات المُستخدمة

| الطبقة | التقنية |
|--------|---------|
| Frontend | HTML5 + CSS3 (Custom Properties) + Vanilla JS (no frameworks) |
| Backend | Hono على Cloudflare Workers (للـ /api/* فقط) |
| Build | Vite 6 + @hono/vite-build |
| Deployment | Cloudflare Pages |
| الخط العربي | Tajawal (Google Fonts) |
| نظام الإحصاء | Apps Script + Google Sheets + Beacon API |

### الميزات التقنية
- ✅ RTL كامل
- ✅ Responsive من 375px
- ✅ خط عربي احترافي (Tajawal بأوزان 400-900)
- ✅ ARIA labels على كل العناصر التفاعلية
- ✅ `prefers-reduced-motion` محترم في كل الصفحات
- ✅ Semantic HTML (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- ✅ نظام تصميم متسق بـ CSS Variables
- ✅ بدون مكتبات JS خارجية
- ✅ تحميل سريع (lazy loading للصور غير الحرجة)
- ✅ SEO meta tags + Open Graph

---

## دليل الاستخدام

### للعميلة (شراء المنتج)
1. ادخلي على الصفحة الرئيسية `/`
2. تصفّحي صور المنتج والمزايا
3. املئي الفورم (الاسم، العنوان، الهاتف، الكمية)
4. اضغطي "أكّدي الطلب الآن"
5. ستنتقلين تلقائياً لصفحة الشكر مع ملخص الطلب
6. سيتصل بكِ الفريق خلال ساعات لتأكيد الطلب

### للمسؤول (إعداد التتبع)
1. ادخلي على `/admin/` وأدخلي كلمة السر (`admin2026` افتراضياً)
2. تبويب "إعداد Apps Script": انسخي السكريبت واتبعي 9 الخطوات
3. تبويب "Webhook": الصقي الرابط (ينتهي بـ `/exec`) ثم اضغطي "حفظ"
4. اضغطي "اختبار الاتصال" للتأكد
5. تبويب "لوحة التحليلات": تابعي الإحصائيات

### تغيير كلمة السر
عدّلي السطر في `public/admin/index.html`:
```js
const ADMIN_PASSWORD = 'كلمة_السر_الجديدة';
```

---

## التطوير المحلي

```bash
# تثبيت
npm install

# بناء
npm run build

# تشغيل (PM2 - موصى به في sandbox)
pm2 start ecosystem.config.cjs

# أو wrangler مباشرة
npx wrangler pages dev dist --ip 0.0.0.0 --port 3000

# الاختبار
curl http://localhost:3000/api/health
```

---

## النشر إلى Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name rahati-store
```

---

## بنية الملفات

```
webapp/
├── src/
│   └── index.tsx              # Hono - يخدّم /api/* فقط
├── public/
│   ├── index.html             # صفحة المنتج (/)
│   ├── admin/
│   │   └── index.html         # لوحة الإدارة (/admin/)
│   ├── thankyou/
│   │   └── index.html         # صفحة الشكر (/thankyou/)
│   ├── static/
│   │   ├── styles.css         # نظام التصميم الموحّد
│   │   └── analytics.js       # تتبع الجلسات + Beacon API
│   ├── _routes.json           # توجيه: Worker لـ /api/* فقط
│   └── static/                # ملفات ثابتة عامة
├── ecosystem.config.cjs       # إعداد PM2
├── vite.config.ts             # إعداد البناء
├── wrangler.jsonc             # إعداد Cloudflare
└── package.json
```

---

## مزايا غير مُنفّذة (مقترحات للتطوير)

- 🔄 **A/B testing** للأسعار والعناوين
- 🔔 **Pixel events** لـ Facebook/TikTok Ads
- 📧 **Email confirmation** عند تقديم الطلب
- 📱 **WhatsApp integration**: زر إرسال الطلب لرقم WhatsApp
- 🌍 **Multi-language**: إضافة الفرنسية بجانب العربية
- 💳 **Payment gateway**: تكامل CMI/PayZone للدفع الإلكتروني
- 🎁 **Coupon codes**: نظام أكواد خصم
- 📊 **Real-time dashboard**: عرض الطلبات الجديدة فورياً عبر Server-Sent Events

---

## الحالة

- **حالة النشر**: ✅ جاهز للنشر على Cloudflare Pages
- **التقنية**: Hono + Vanilla JS + CSS Custom Properties
- **آخر تحديث**: مايو 2026
- **اللغة الأساسية**: العربية (RTL)
- **العملة**: الدرهم المغربي (MAD)

---

صُنع بحب للسوق المغربي 🇲🇦 ❤️
