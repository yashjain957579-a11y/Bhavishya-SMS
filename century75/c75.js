// Century in 75 · shared settings for quiz.html and leaderboard.html.
// After deploying the Apps Script web app (century75/web/SETUP.md in the AI Editor folder), paste its URL here:
var C75_API = 'PASTE_WEB_APP_URL_HERE';

// Passes (same Razorpay links as series.js on century-in-75.html: change both together).
var C75_FREE_UNTIL = '2026-11-22';  // last free day (Day 7, Sunday)
var C75_WHATSAPP = '918889404060';
var C75_PLANS = [
  { name: 'Self-Study', price: '₹249', was: '₹499', url: 'https://rzp.io/rzp/4HQgx4iq',
    points: ['All 75 exit quizzes + leaderboard', 'All 75 practice sheets + answer keys', 'Chapter notes'] },
  { name: 'Pro AI', price: '₹599', was: '₹1,299', url: 'https://rzp.io/rzp/e4QPB2Cl', tag: 'Most popular', note: 'Early Bird: first 100 students',
    points: ['Everything in Self-Study', '20 AI-checked board tests', 'Step-marking + keyword feedback'] },
  { name: 'Elite', price: '₹1,499', was: '₹2,499', url: 'https://rzp.io/rzp/uGTwcip5', note: '50 seats',
    points: ['Everything in Pro AI', '25 AI-checked tests', '1-on-1 copy audit by Yash Sir & Rohit Sir'] }
];

(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (C75_API.indexOf('PASTE') === 0 && local) C75_API = '/api';  // local mock server (century75/web/test/mock_server.js)

  function call(url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('Server error ' + r.status);
      return r.json();
    }).then(function (j) {
      if (j && j.ok === false) { var err = new Error(j.error || 'Something went wrong.'); err.data = j; throw err; }
      return j;
    });
  }

  window.C75 = {
    configured: C75_API.indexOf('PASTE') !== 0,
    get: function (params) {
      var qs = Object.keys(params || {}).filter(function (k) { return params[k] != null && params[k] !== ''; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
      return call(C75_API + (qs ? '?' + qs : ''), { method: 'GET' });
    },
    post: function (body) {  // text/plain = no CORS preflight (Apps Script can't answer one)
      return call(C75_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    },
    store: {
      get: function (k) { try { return JSON.parse(localStorage.getItem('c75_' + k)); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem('c75_' + k, JSON.stringify(v)); } catch (e) { } }
    },
    el: function (tag, attrs, kids) {
      var n = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === 'text') n.textContent = attrs[k];
        else if (k === 'class') n.className = attrs[k];
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
      (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
      return n;
    },
    fmtDate: function (iso) {  // '2026-11-17' -> 'Tue 17 Nov'
      var d = new Date(iso + 'T12:00:00+05:30');
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
    },
    fmtTime: function (ms) {
      return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    },
    pad: function (n) { return (n < 10 ? '0' : '') + n; },

    // Free week still on? Days left including today (IST), 0 once it is over.
    freeDaysLeft: function () {
      var end = new Date(C75_FREE_UNTIL + 'T23:59:59+05:30').getTime();
      return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
    },

    // The passes, as cards. opts: {kicker, title, sub}
    plans: function (opts) {
      var el = window.C75.el;
      opts = opts || {};
      return el('section', { class: 'card plans-card', id: 'passes' }, [
        el('div', { class: 'kicker', text: opts.kicker || 'Century in 75 passes' }),
        el('h2', { text: opts.title || 'Keep going after Week 1' }),
        opts.sub ? el('p', { class: 'muted small', text: opts.sub }) : null,
        el('div', { class: 'plans' }, C75_PLANS.map(function (p) {
          return el('div', { class: 'plan' + (p.tag ? ' pop' : '') }, [
            p.tag ? el('span', { class: 'plan-tag', text: p.tag }) : null,
            el('div', { class: 'plan-name', text: p.name }),
            el('div', { class: 'plan-price' }, [p.price, el('s', { text: p.was })]),
            p.note ? el('div', { class: 'plan-note', text: p.note }) : null,
            el('ul', {}, p.points.map(function (t) { return el('li', { text: t }); })),
            el('a', { class: 'btn' + (p.tag ? '' : ' dark'), href: p.url, target: '_blank', rel: 'noopener', text: 'Get ' + p.name + ' · ' + p.price })
          ]);
        })),
        el('p', { class: 'small muted plans-foot' }, [
          'Pay with the WhatsApp number you use here: quiz access turns on within 10 minutes. ',
          el('a', { href: '../century-in-75.html#compare', text: 'Compare all passes' }), ' · ',
          el('a', { href: 'https://wa.me/' + C75_WHATSAPP + '?text=' + encodeURIComponent('Hi Bhavishya SMS, I paid for a Century in 75 pass but the exit quiz does not open for my number.'),
                   target: '_blank', rel: 'noopener', text: 'Paid but locked? WhatsApp us' })
        ])
      ]);
    },

    // Thin banner for the free week: "Week 1 is free till Sun, 22 Nov · 5 days left · See passes"
    freeBanner: function () {
      var el = window.C75.el, left = this.freeDaysLeft();
      if (!left) return null;
      return el('a', { class: 'free-banner', href: '#passes' }, [
        el('b', { text: '🎁 Week 1 is free' }),
        el('span', { text: ' till ' + this.fmtDate(C75_FREE_UNTIL) + ' · ' + (left === 1 ? 'last day' : left + ' days left') + '. From Day 8, exit quizzes need a pass. ' }),
        el('u', { text: 'See passes →' })
      ]);
    }
  };
})();
