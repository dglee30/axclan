/*
	Eventually by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function () {
  'use strict';

  var $body = document.querySelector('body');

  // Methods/polyfills.

  /*
		// classList | (c) @remy | github.com/remy/polyfills | rem.mit-license.org
			!function(){function t(t){this.el=t;for(var n=t.className.replace(/^\s+|\s+$/g,"").split(/\s+/),i=0;i<n.length;i++)e.call(this,n[i])}function n(t,n,i){Object.defineProperty?Object.defineProperty(t,n,{get:i}):t.__defineGetter__(n,i)}if(!("undefined"==typeof window.Element||"classList"in document.documentElement)){var i=Array.prototype,e=i.push,s=i.splice,o=i.join;t.prototype={add:function(t){this.contains(t)||(e.call(this,t),this.el.className=this.toString())},contains:function(t){return-1!=this.el.className.indexOf(t)},item:function(t){return this[t]||null},remove:function(t){if(this.contains(t)){for(var n=0;n<this.length&&this[n]!=t;n++);s.call(this,n,1),this.el.className=this.toString()}},toString:function(){return o.call(this," ")},toggle:function(t){return this.contains(t)?this.remove(t):this.add(t),this.contains(t)}},window.DOMTokenList=t,n(Element.prototype,"classList",function(){return new t(this)})}}();
*/
  // canUse
  window.canUse = function (p) {
    if (!window._canUse) window._canUse = document.createElement('div');
    var e = window._canUse.style,
      up = p.charAt(0).toUpperCase() + p.slice(1);
    return (
      p in e ||
      'Moz' + up in e ||
      'Webkit' + up in e ||
      'O' + up in e ||
      'ms' + up in e
    );
  };

  // window.addEventListener
  (function () {
    if ('addEventListener' in window) return;
    window.addEventListener = function (type, f) {
      window.attachEvent('on' + type, f);
    };
  })();

  // Play initial animations on page load.
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      $body.classList.remove('is-preload');
    }, 100);
  });

  // Slideshow Background.
  (function () {
    // Settings.
    var settings = {
      // Images (in the format of 'url': 'alignment').
      images: {
        'images/bg01.jpg': 'center',
        'images/bg02.jpg': 'center',
        'images/bg03.jpg': 'center',
      },

      // Delay.
      delay: 6000,
    };

    // Vars.
    var pos = 0,
      lastPos = 0,
      $wrapper,
      $bgs = [],
      $bg,
      k,
      v;

    // Create BG wrapper, BGs.
    $wrapper = document.createElement('div');
    $wrapper.id = 'bg';
    $body.appendChild($wrapper);

    for (k in settings.images) {
      // Create BG.
      $bg = document.createElement('div');
      $bg.style.backgroundImage = 'url("' + k + '")';
      $bg.style.backgroundPosition = settings.images[k];
      $wrapper.appendChild($bg);

      // Add it to array.
      $bgs.push($bg);
    }

    // Main loop.
    $bgs[pos].classList.add('visible');
    $bgs[pos].classList.add('top');

    // Bail if we only have a single BG or the client doesn't support transitions.
    if ($bgs.length == 1 || !canUse('transition')) return;

    window.setInterval(function () {
      lastPos = pos;
      pos++;

      // Wrap to beginning if necessary.
      if (pos >= $bgs.length) pos = 0;

      // Swap top images.
      $bgs[lastPos].classList.remove('top');
      $bgs[pos].classList.add('visible');
      $bgs[pos].classList.add('top');

      // Hide last image after a short delay.
      window.setTimeout(function () {
        $bgs[lastPos].classList.remove('visible');
      }, settings.delay / 2);
    }, settings.delay);
  })();

  // Signup Form.
  (function () {
    // Vars.
    var $form = document.querySelectorAll('#search-form')[0],
      $submit = document.querySelectorAll(
        '#search-form input[type="submit"]',
      )[0],
      $message;

    // Bail if addEventListener isn't supported.
    if (!('addEventListener' in $form)) return;

    // Message.
    $message = document.createElement('span');
    $message.classList.add('message');
    $form.appendChild($message);

    $message._show = function (type, text) {
      $message.innerHTML = text;
      $message.classList.add(type);
      $message.classList.add('visible');

      window.setTimeout(function () {
        $message._hide();
      }, 3000);
    };

    $message._hide = function () {
      $message.classList.remove('visible');
    };

    // Events.
    // Note: If you're *not* using AJAX, get rid of this event listener.
    $form.addEventListener('submit', function (event) {
      event.preventDefault();

      const alias = document.getElementById('alias').value.trim();

      if (!alias) {
        $message._show('failure', '아이디를 입력하세요');
        return;
      }

      location.href = `profile.html?alias=${encodeURIComponent(alias)}`;
    });
  })();

  const API = 'https://xmploueumzkrdvapbyfs.supabase.co/rest/v1';

  const KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcGxvdWV1bXprcmR2YXBieWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI4ODY5MTQsImV4cCI6MTk4ODQ2MjkxNH0.p8Jkm2fnFzzy7YYdCs0NVjBdqLmUzvBFJjdf3V0bHuo';

  const input = document.getElementById('alias');

  const suggestions = document.getElementById('suggestions');

  input.addEventListener('input', async () => {
    const keyword = input.value.trim();

    if (keyword.length < 2) {
      suggestions.style.display = 'none';
      suggestions.innerHTML = '';
      return;
    }

    const url = `${API}/player_profile_view?select=*&alias=ilike.${encodeURIComponent(keyword)}*&limit=10`;

    const res = await fetch(url, {
      headers: { apikey: KEY },
    });

    const data = await res.json();

    function getTierClass(rank) {
      if (rank === 'S') return 'tier-s';
      if (rank === 'A') return 'tier-a';
      if (rank === 'B') return 'tier-b';
      if (rank === 'C') return 'tier-c';
      if (rank === 'D') return 'tier-d';
      if (rank === 'E') return 'tier-e';
      if (rank === 'F') return 'tier-f';

      return 'tier-default';
    }

    suggestions.innerHTML = data
      .map(
        (v) => `

<div class="suggestion-item"
     data-alias="${v.alias}"
	 data-account-id="${v.account_id}">

    <div class="s-left">

        <div class="tier ${getTierClass(v.rank)}">
            ${v.rank || '-'}
        </div>

        <div class="player-name">
            ${v.alias}
        </div>

    </div>

    <div class="battlenet_name">
        ${v.battlenet_name}
    </div>

</div>

`,
      )
      .join('');

    suggestions.style.display = data.length ? 'block' : 'none';
  });

  suggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');

    if (!item) return;

    location.href = `profile.html?alias=${encodeURIComponent(item.dataset.alias)}&battlenet_account=${encodeURIComponent(item.dataset.accountId)}`;
  });
})();
