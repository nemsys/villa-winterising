<script>
(function(){
  function click(el){ el.dispatchEvent(new MouseEvent("click",{bubbles:true})); }
  function rowByN(day,n){ var r=null;
    document.querySelectorAll("#"+day+" .row").forEach(function(x){ if(x.dataset.key===n) r=x; }); return r; }
  window.confirm=function(){return true;};
  setTimeout(function(){
    var phase = localStorage.getItem("ТЕСТ-ФАЗА");
    if (!phase) {
      click(document.getElementById("editbtn"));
      // редакция
      click(rowByN("sat","37"));
      document.getElementById("edt").value="Изолирай тръбите и крана отвън";
      document.getElementById("edm").value="40";
      click(document.getElementById("edsave"));
      // добавяне
      click(document.querySelector("#fri .phase .addbtn"));
      document.getElementById("edt").value="Прочисти улуците";
      document.getElementById("edm").value="25";
      click(document.getElementById("edsave"));
      // изтриване
      click(rowByN("thu","Ч1"));
      click(document.getElementById("eddel"));
      // разместване
      click(rowByN("sat","31").querySelector('[data-act="up"]'));
      // отметка
      click(document.getElementById("donebtn"));
      click(rowByN("sat","14"));
      localStorage.setItem("ТЕСТ-ФАЗА","2");
      document.title="ПРОХОД1|записано";
    } else {
      var o=[];
      function ok(c,m){ o.push((c?"OK   ":"ПАДНА ")+m); }
      var r37=rowByN("sat","37");
      ok(r37 && r37.querySelector(".t").textContent==="Изолирай тръбите и крана отвън","редакцията оцеля рестарта");
      ok(r37 && r37.querySelector(".min").textContent==="40′","минутите оцеляха");
      ok(r37 && r37.querySelector(".n").textContent.indexOf("тиксо")!==-1,"бележката оцеля");
      var added=null;
      document.querySelectorAll("#fri .row").forEach(function(x){
        if(x.querySelector(".t").textContent==="Прочисти улуците") added=x; });
      ok(!!added,"добавената задача оцеля");
      ok(!rowByN("thu","Ч1"),"изтритата задача остана изтрита");
      ok(document.querySelectorAll(".row").length===60,"общо 60 реда (60-1+1): "+document.querySelectorAll(".row").length);
      var sat=document.querySelectorAll("#sat .row");
      var last=document.querySelectorAll("#sat .phase")[3].querySelectorAll(".row");
      ok(last[3].dataset.key==="31","31 се вдигна на позиция 4, там е "+last[3].dataset.key);
      ok(last[4].dataset.key==="32в","32в слезе на позиция 5, там е "+last[4].dataset.key);
      var r14=rowByN("sat","14");
      ok(r14 && r14.getAttribute("aria-checked")==="true","отметката оцеля");
      var wrong=[]; document.querySelectorAll('.row[aria-checked="true"]').forEach(function(x){ wrong.push(x.dataset.key); });
      ok(wrong.length===1 && wrong[0]==="14","само 14 е отметнат, отметнати: "+wrong.join(","));
      document.title="ПРОХОД2|"+o.join("|");
    }
  },300);
})();
</script></body>
</html>

</html>

</html>

</html>

</html>
