/**
 * AlzMedia Publisher Embed Script
 * Usage: <script src="https://ads.alz.name.ng/serve.js?pub=PUB-XXXX" async></script>
 * Then:  <div class="alz-ad" data-slot="SLOT_ID" data-device="web"></div>
 */
(function () {
  'use strict';

  var API = '%%SERVER_URL%%'; // replaced at runtime by server
  var params = (function () {
    var s = document.currentScript && document.currentScript.src || '';
    var q = s.split('?')[1] || '';
    var p = {};
    q.split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv[0]) p[kv[0]] = decodeURIComponent(kv[1] || '');
    });
    return p;
  })();

  var pub = params.pub;
  if (!pub) return;

  function renderAd(container, ad) {
    if (!ad) { container.style.display = 'none'; return; }
    container.style.display = 'block';

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;overflow:hidden;cursor:pointer;border-radius:6px;';

    var el;
    if (ad.creative_type === 'image' && ad.file_url) {
      el = document.createElement('img');
      el.src   = ad.file_url;
      el.alt   = ad.headline || 'Ad';
      el.style.cssText = 'width:100%;height:auto;display:block;';
    } else if (ad.creative_type === 'video' && ad.file_url) {
      el = document.createElement('video');
      el.src      = ad.file_url;
      el.autoplay = true;
      el.muted    = true;
      el.loop     = true;
      el.style.cssText = 'width:100%;height:auto;display:block;';
    } else {
      el = document.createElement('div');
      el.style.cssText = 'padding:14px;background:#f5f5f5;font-family:sans-serif;';
      el.innerHTML = '<strong>' + (ad.headline || '') + '</strong><p style="margin:6px 0 0;font-size:13px;">' + (ad.description || '') + '</p>';
    }

    var label = document.createElement('span');
    label.textContent  = 'Ad';
    label.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;font-family:sans-serif;';

    wrapper.appendChild(el);
    wrapper.appendChild(label);
    container.innerHTML = '';
    container.appendChild(wrapper);

    // Click tracking
    wrapper.addEventListener('click', function () {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API + '/api/ad/click', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        impression_id: ad.meta && ad.meta.impression_id,
        campaign_id:   ad.campaign_id,
        creative_id:   ad.creative_id,
        slot_id:       ad.meta && ad.meta.slot_id,
        publisher_id:  ad.meta && ad.meta.publisher_id,
      }));
      window.open(ad.click_url, '_blank', 'noopener,noreferrer');
    });
  }

  function loadSlot(container) {
    var slot   = container.getAttribute('data-slot');
    var device = container.getAttribute('data-device') || 'web';
    if (!slot) return;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', API + '/api/ad/serve?pub=' + encodeURIComponent(pub) + '&slot=' + encodeURIComponent(slot) + '&device=' + encodeURIComponent(device), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        try {
          var res = JSON.parse(xhr.responseText);
          renderAd(container, res.data);
        } catch (e) { /* silent fail */ }
      }
    };
    xhr.send();
  }

  function init() {
    var containers = document.querySelectorAll('.alz-ad');
    for (var i = 0; i < containers.length; i++) {
      loadSlot(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
