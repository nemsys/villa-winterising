<script>
(function () {
  window.confirm = function () { return true; };
  var out = [];
  function ok(c, m) { out.push((c ? "OK   " : "ПАДНА ") + m); }
  function rowsIn(day) { return document.querySelectorAll("#" + day + " .row"); }
  function rowByN(day, n) {
    var r = null;
    rowsIn(day).forEach(function (x) { if (x.dataset.key === n) r = x; });
    return r;
  }
  function getLocalRaw(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function click(el) { el.dispatchEvent(new MouseEvent("click", {bubbles: true})); }

  setTimeout(function () {
    ok(document.querySelectorAll(".row").length === 60, "60 реда се рендерират");
    ok(rowsIn("thu").length === 11, "четвъртък има 11 реда, има " + rowsIn("thu").length);

    // отметни "9" (червеният кран) в събота
    var r9 = rowByN("sat", "9");
    ok(!!r9, "ред 9 е в събота");
    click(r9);
    ok(r9.getAttribute("aria-checked") === "true", "ред 9 се отмята");

    // влез в режим Подредба
    click(document.getElementById("editbtn"));
    ok(document.getElementById("app").classList.contains("editing"), "режимът Подредба се включва");
    ok(!document.getElementById("editbar").classList.contains("hide"), "лентата се показва");

    // клик по ред в режим Подредба не отмята
    var rCh1 = rowByN("thu", "Ч1");
    click(rCh1);
    ok(rCh1.getAttribute("aria-checked") === "false", "клик в режим Подредба не отмята");

    // стрелка надолу мести Ч1 на второ място
    click(rCh1.querySelector('[data-act="down"]'));
    ok(rowsIn("thu")[1].dataset.key === "Ч1", "Ч1 слезе на второ място, там е " + rowsIn("thu")[1].dataset.key);
    ok(rowsIn("thu")[0].dataset.key === "Ч2", "Ч2 се вдигна пръв");

    // премести Ч1 в петък/Вътре (опция с индекс 2)
    click(rowByN("thu", "Ч1").querySelector('[data-act="move"]'));
    ok(!document.getElementById("sheet").classList.contains("hide"), "шийтът се отваря");
    var opts = document.querySelectorAll("#sheetlist .opt");
    ok(opts.length === 8, "8 възможни фази, намерени " + opts.length);
    click(opts[2]);
    ok(document.getElementById("sheet").classList.contains("hide"), "шийтът се затваря");
    ok(!rowByN("thu", "Ч1"), "Ч1 вече не е в четвъртък");
    ok(!!rowByN("fri", "Ч1"), "Ч1 е в петък");
    ok(rowsIn("thu").length === 10, "четвъртък има 10 реда, има " + rowsIn("thu").length);
    ok(rowsIn("fri").length === 15, "петък има 15 реда, има " + rowsIn("fri").length);
    ok(document.querySelector('.tabs button[data-day="fri"]').getAttribute("aria-selected") === "true",
       "изгледът скача на петък");

    // отметката на 9 оцелява разместването и си стои на 9
    var r9b = rowByN("sat", "9");
    ok(r9b && r9b.getAttribute("aria-checked") === "true", "отметката на 9 оцеля разместването");
    var wrong = [];
    document.querySelectorAll('.row[aria-checked="true"]').forEach(function (x) {
      if (x.dataset.key !== "9") wrong.push(x.dataset.key);
    });
    ok(wrong.length === 0, "не се отметнаха чужди редове (" + wrong.join(",") + ")");

    // времената на деня се преизчисляват
    var thuTot = document.querySelector("#thu .tot").textContent;
    var friTot = document.querySelector("#fri .tot").textContent;
    ok(thuTot === "общо 2 ч 55 мин работа", "четвъртък 195-20=175: " + thuTot);
    ok(friTot === "общо 3 ч 7 мин работа", "петък 167+20=187: " + friTot);
    var friPh = document.querySelectorAll("#fri .phase header span");
    ok(friPh[1].textContent === "≈1 ч 30 мин", "фазата Вътре 70+20=90: " + friPh[1].textContent);

    // наредбата е записана
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem("zazimyavane-layout-2026")); } catch (e) {}
    ok(!!saved, "наредбата е записана в localStorage");
    ok(saved && saved.fri[1].indexOf("Ч1") !== -1, "записаната наредба съдържа Ч1 в петък/Вътре");

    // изнасяне
    click(document.getElementById("exportbtn"));
    var txt = document.getElementById("exptext").value;
    ok(txt.indexOf("Ч1") !== -1, "изнесеният текст съдържа Ч1");
    click(document.querySelector("#expsheet [data-close]"));

    // връщане на изходната
    click(document.getElementById("revertbtn"));
    ok(rowsIn("thu").length === 11, "след връщане четвъртък пак има 11 реда");
    ok(!!rowByN("thu", "Ч1"), "Ч1 се върна в четвъртък");
    ok(rowByN("sat", "9").getAttribute("aria-checked") === "true", "отметката на 9 оцеля и връщането");

    // излизане от режима
    click(document.getElementById("editbtn"));
    ok(!document.getElementById("app").classList.contains("editing"), "режимът се изключва");
    var r14 = rowByN("sat", "14");
    click(r14);
    ok(r14.getAttribute("aria-checked") === "true", "след излизане отмятането пак работи");


    // ---------- редактиране и добавяне ----------
    click(document.getElementById("editbtn"));
    ok(getComputedStyle(document.querySelector("#fri .addbtn")).display !== "none",
       "бутонът „Добави задача“ се вижда в режим Подредба");

    // редакция на съществуваща
    click(rowByN("sat", "37"));
    ok(!document.getElementById("edsheet").classList.contains("hide"), "редакторът се отваря");
    ok(document.getElementById("edtitle").textContent === "Редакция", "заглавие Редакция");
    ok(document.getElementById("edt").value.indexOf("Изолирай тръбите") === 0, "текстът е зареден");
    ok(document.getElementById("edm").value === "30", "минутите са заредени: " + document.getElementById("edm").value);
    ok(document.getElementById("edkey").checked === true, "флагът „критична“ е зареден");
    ok(!document.getElementById("eddel").classList.contains("hide"), "„Изтрий“ се вижда при редакция");
    var satBefore = document.querySelector("#sat .tot").textContent;
    document.getElementById("edt").value = "Изолирай тръбите и крана отвън";
    document.getElementById("edm").value = "40";
    click(document.getElementById("edsave"));
    ok(document.getElementById("edsheet").classList.contains("hide"), "редакторът се затваря след запис");
    ok(rowByN("sat","37").querySelector(".t").textContent === "Изолирай тръбите и крана отвън", "новият текст се показва");
    ok(rowByN("sat","37").querySelector(".min").textContent === "40′", "новите минути се показват");
    ok(document.querySelector("#sat .tot").textContent !== satBefore, "общото на деня следва редакцията");
    ok(rowByN("sat","37").classList.contains("key"), "флагът „критична“ оцелява редакцията");
    ok(rowByN("sat","37").querySelector(".n").textContent.indexOf("тиксо") !== -1, "бележката оцелява");

    // добавяне на нова
    var friBefore = rowsIn("fri").length;
    click(document.querySelector("#fri .phase .addbtn"));
    ok(document.getElementById("edtitle").textContent === "Нова задача", "заглавие Нова задача");
    ok(document.getElementById("eddel").classList.contains("hide"), "„Изтрий“ е скрит при нова");
    ok(document.getElementById("edt").value === "", "полето е празно за нова");
    document.getElementById("edt").value = "Прочисти улуците и водосточните тръби";
    document.getElementById("edm").value = "25";
    document.getElementById("edkey").checked = true;
    click(document.getElementById("edsave"));
    ok(rowsIn("fri").length === friBefore + 1, "петък получи ред: " + rowsIn("fri").length);
    var added = null;
    rowsIn("fri").forEach(function (x) {
      if (x.querySelector(".t").textContent.indexOf("улуците") !== -1) added = x;
    });
    ok(!!added, "новата задача се вижда");
    ok(added && added.classList.contains("key"), "новата задача е болдната");
    ok(added && added.dataset.key.indexOf("нова-") === 0, "новата задача има собствен номер");

    // празен текст не се записва
    click(document.querySelector("#fri .phase .addbtn"));
    document.getElementById("edt").value = "   ";
    click(document.getElementById("edsave"));
    ok(!document.getElementById("edsheet").classList.contains("hide"), "празна задача не се записва");
    click(document.querySelector("#edsheet [data-close]"));

    // изтриване на изходна задача
    var thuBefore = rowsIn("thu").length;
    click(rowByN("thu", "Ч1"));
    click(document.getElementById("eddel"));
    ok(rowsIn("thu").length === thuBefore - 1, "четвъртък загуби ред: " + rowsIn("thu").length);
    ok(!rowByN("thu", "Ч1"), "Ч1 е изтрита");

    // изнасяне съдържа промените
    click(document.getElementById("exportbtn"));
    var ex = document.getElementById("exptext").value;
    ok(ex.indexOf("улуците") !== -1, "изнесеното съдържа новата задача");
    ok(ex.indexOf("Измий туристическите обувки") === -1, "изнесеното още съдържа изтритата");
    ok(ex.indexOf("Изолирай тръбите и крана отвън") !== -1, "изнесеното съдържа редакцията");
    var parsed = null;
    try { parsed = JSON.parse(ex); } catch (e) {}
    ok(!!parsed && !!parsed.sat[0].water, "изнесеното е валиден JSON и пази водната фаза");
    click(document.querySelector("#expsheet [data-close]"));

    // записано е
    ok(!!getLocalRaw("zazimyavane-items-2026"), "редакциите са записани");

    // връщане на изходното
    click(document.getElementById("revertbtn"));
    ok(document.querySelectorAll(".row").length === 60, "след връщане пак 60 реда: " + document.querySelectorAll(".row").length);
    ok(!!rowByN("thu", "Ч1"), "изтритата задача се върна");
    ok(rowByN("sat","37").querySelector(".t").textContent === "Изолирай тръбите отвън със сивите цилиндри", "текстът се върна изходен");
    ok(rowByN("sat","9").getAttribute("aria-checked") === "true", "отметките оцеляха всичко това");
    click(document.getElementById("donebtn"));
    ok(!document.getElementById("app").classList.contains("editing"), "„Готово“ в лентата изключва режима");

    document.title = "РЕЗУЛТАТ|" + out.join("|");
  }, 300);
})();
</script>
