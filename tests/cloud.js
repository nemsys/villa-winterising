<script>
// Облакът срещу фалшив GitHub в паметта. „Другото устройство“ е пряка
// промяна на файла в облака между две синхронизации.
(function () {
  window.confirm = function () { return true; };
  var out = [];
  function ok(c, m) { out.push((c ? "OK   " : "ПАДНА ") + m); }
  function click(el) { el.dispatchEvent(new MouseEvent("click", {bubbles: true})); }
  function rowByN(day, n) {
    var r = null;
    document.querySelectorAll("#" + day + " .row").forEach(function (x) { if (x.dataset.key === n) r = x; });
    return r;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function b64(s) { var b = new TextEncoder().encode(s), r = ""; b.forEach(function (x) { r += String.fromCharCode(x); }); return btoa(r); }
  function unb64(s) { var r = atob(s), b = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) b[i] = r.charCodeAt(i); return new TextDecoder().decode(b); }

  // ---- фалшив GitHub ----
  var file = null, sha = 0, calls = [], down = false;
  window.fetch = function (url, o) {
    calls.push(o.method + " " + url);
    if (down) { return Promise.reject(new TypeError("offline")); }
    if (o.headers.Authorization !== "Bearer тест-ключ") { return Promise.resolve(new Response("{}", { status: 401 })); }
    if (o.method === "GET") {
      if (!file) { return Promise.resolve(new Response("{}", { status: 404 })); }
      return Promise.resolve(new Response(JSON.stringify({ sha: "s" + sha, content: b64(file).replace(/(.{60})/g, "$1\n") }), { status: 200 }));
    }
    var body = JSON.parse(o.body);
    if (file && body.sha !== "s" + sha) { return Promise.resolve(new Response("{}", { status: 409 })); }
    file = unb64(body.content);
    sha++;
    return Promise.resolve(new Response("{}", { status: 200 }));
  };
  function remote() { return file ? JSON.parse(file) : null; }

  var KEYS = ["zazimyavane-2026", "zazimyavane-layout-2026", "zazimyavane-items-2026",
              "zazimyavane-notes-2026", "zazimyavane-archive-2026", "zazimyavane-sync-2026",
              "zazimyavane-cloud-2026"];

  setTimeout(function () {
    var stat = document.getElementById("cloudstat");
    ok(stat.textContent.indexOf("Не е свързано") === 0, "без връзка пише „Не е свързано“: " + stat.textContent);
    ok(calls.length === 0, "без връзка не се вика мрежа");
    ok(document.getElementById("cloudnow").classList.contains("hide"), "без връзка няма бутон за синхронизация");

    // отметка и бележка отпреди свързването
    click(rowByN("sat", "14"));
    click(rowByN("sat", "6").querySelector(".pen"));
    document.getElementById("edmine").value = "мрежата в синия плик";
    click(document.getElementById("edsave"));

    // грешен ключ
    click(document.getElementById("cloudset"));
    document.getElementById("clrepo").value = "https://github.com/iva/vila-danni.git";
    document.getElementById("cltoken").value = "грешен";
    click(document.getElementById("clsave"));

    wait(200).then(function () {
      ok(stat.classList.contains("warn") && stat.textContent.indexOf("Ключът не става") === 0, "грешен ключ се съобщава: " + stat.textContent);
      ok(JSON.parse(localStorage.getItem("zazimyavane-cloud-2026")).repo === "iva/vila-danni", "адресът на хранилището се изчиства от линк");
      var page = document.documentElement.cloneNode(true);
      page.querySelectorAll("script").forEach(function (x) { x.remove(); });
      ok(page.outerHTML.indexOf("грешен") === -1, "ключът не е в страницата");

      click(document.getElementById("cloudset"));
      ok(document.getElementById("cltoken").value === "грешен", "настройките се зареждат обратно");
      document.getElementById("cltoken").value = "тест-ключ";
      click(document.getElementById("clsave"));
      return wait(200);
    }).then(function () {
      var r = remote();
      ok(!!r, "първото свързване качи файл");
      ok(r && r.state["14"].v === true, "отметката отпреди свързването е в облака");
      ok(r && r.notes["6"].t === "мрежата в синия плик", "бележката е в облака");
      ok(!stat.classList.contains("warn") && stat.textContent.indexOf("Синхронизирано") === 0, "статусът е „Синхронизирано“: " + stat.textContent);

      // отметка се качва сама след кратко изчакване
      var before = sha;
      click(rowByN("sat", "15"));
      return wait(2000).then(function () {
        ok(sha === before + 1 && remote().state["15"].v === true, "отметката се качи сама");
      });
    }).then(function () {
      // синхронизация без промяна не качва нищо
      var before = sha;
      click(document.getElementById("cloudnow"));
      return wait(200).then(function () { ok(sha === before, "без промяна не се качва: " + (sha - before)); });
    }).then(function () {
      // „друго устройство“ мени облака: отмята 14, добавя бележка, трие 6, мести 31
      var r = remote(), t = Date.now() + 1000;
      r.state["14"] = { v: false, t: t };
      r.state["4"] = { v: true, t: t };
      r.notes["9"] = { t: "от телефона", d: t };
      delete r.notes["6"]; r.gone["6"] = t;
      var ph = r.layout.sat[3]; ph.splice(ph.indexOf("31"), 1); r.layout.fri[1].push("31"); r.ord = t;
      file = JSON.stringify(r); sha++;
      document.dispatchEvent(new Event("visibilitychange"));
      return wait(300);
    }).then(function () {
      ok(rowByN("sat", "14").getAttribute("aria-checked") === "false", "отмятането от другото устройство дойде");
      ok(rowByN("sat", "4").getAttribute("aria-checked") === "true", "отметката от другото устройство дойде");
      ok(rowByN("sat", "15").getAttribute("aria-checked") === "true", "местната отметка оцеля сливането");
      ok(!!rowByN("sat", "9").querySelector(".mine"), "бележката от другото устройство дойде");
      ok(!rowByN("sat", "6").querySelector(".mine"), "триенето на бележка от другото устройство дойде");
      ok(!!rowByN("fri", "31") && !rowByN("sat", "31"), "разместването от другото устройство дойде");
      ok(JSON.parse(localStorage.getItem("zazimyavane-notes-2026"))["9"].t === "от телефона", "дошлото от облака е записано и тук");
      ok(document.querySelectorAll(".row").length === 60, "след сливането пак 60 реда");

      // докато е отворен лист, не пренарежда
      var r = remote(); r.state["5"] = { v: true, t: Date.now() + 2000 }; file = JSON.stringify(r); sha++;
      click(rowByN("sat", "13").querySelector(".pen"));
      click(document.getElementById("cloudnow"));
      return wait(300).then(function () {
        ok(rowByN("sat", "5").getAttribute("aria-checked") === "false", "синхронизира под отворен лист");
        click(document.querySelector("#edsheet [data-close]"));
        return wait(3500);
      }).then(function () {
        ok(rowByN("sat", "5").getAttribute("aria-checked") === "true", "след затваряне на листа не довърши");
      });
    }).then(function () {
      // конфликт: облакът се мени между GET и PUT
      var realFetch = window.fetch, once = true;
      window.fetch = function (url, o) {
        if (o.method === "PUT" && once) {
          once = false;
          var r = remote(); r.state["7"] = { v: true, t: Date.now() + 3000 }; file = JSON.stringify(r); sha++;
        }
        return realFetch(url, o);
      };
      click(rowByN("sat", "16"));
      return wait(2500).then(function () {
        window.fetch = realFetch;
        var r = remote();
        ok(r.state["16"].v === true && r.state["7"].v === true, "при конфликт се губи едната промяна");
        ok(rowByN("sat", "7").getAttribute("aria-checked") === "true", "при конфликт чуждата промяна не дойде тук");
      });
    }).then(function () {
      // без мрежа: промяната чака и тръгва при връзка
      down = true;
      click(rowByN("sat", "17"));
      return wait(2000).then(function () {
        ok(stat.classList.contains("warn") && stat.textContent.indexOf("Няма връзка") === 0, "без мрежа се съобщава: " + stat.textContent);
        down = false;
        window.dispatchEvent(new Event("online"));
        return wait(300);
      }).then(function () {
        ok(remote().state["17"].v === true, "промяната без мрежа не тръгна при връзка");
        ok(!stat.classList.contains("warn"), "предупреждението остана след връзка");
      });
    }).then(function () {
      // изчистване на отметките стига и до облака
      click(document.getElementById("reset"));
      return wait(2000).then(function () {
        var r = remote(), on = Object.keys(r.state).filter(function (n) { return r.state[n].v; });
        ok(on.length === 0, "изчистените отметки останаха в облака: " + on.join(","));
      });
    }).then(function () {
      click(document.getElementById("cloudset"));
      click(document.getElementById("cloff"));
      ok(localStorage.getItem("zazimyavane-cloud-2026") === null, "изключването не изтри ключа");
      ok(stat.textContent.indexOf("Не е свързано") === 0, "след изключване не пише „Не е свързано“");
      var n = calls.length;
      click(rowByN("sat", "18"));
      return wait(2000).then(function () { ok(calls.length === n, "след изключване пак вика мрежа"); });
    }).then(function () {
      KEYS.forEach(function (k) { localStorage.removeItem(k); });
      document.title = "РЕЗУЛТАТ|" + out.join("|");
    }).catch(function (e) {
      document.title = "РЕЗУЛТАТ|ПАДНА изключение: " + e + "|" + out.join("|");
    });
  }, 300);
})();
</script>
