/* myFunctions.js - ملف جافاسكريبت الوحيد: جميع التوابع اللازمة للموقع */

var DISCOUNT_LIMIT_DAYS = 10;   // الخصم عند تجاوز 10 أيام
var DISCOUNT_RATE = 0.05;       // نسبة الخصم 5%

/* ---------- توابع مساعدة ---------- */
function formatMoney(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ل.س";
}

/* تحويل نص بصيغة yyyy-mm-dd إلى تاريخ، وإرجاع null إذا كان غير صحيح */
function parseDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (m === null) {
        return null;
    }
    var y = parseInt(m[1], 10);
    var mo = parseInt(m[2], 10);
    var d = parseInt(m[3], 10);
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
        return null;
    }
    return dt;
}

/* عدد الأيام بين تاريخين */
function daysBetween(start, end) {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/* ---------- توابع التحقق: تعيد نص الخطأ أو "" عند الصحة ---------- */
function validateName(v) {
    if (v === "") { return ""; }   // الحقل اختياري
    if (!/^[\u0621-\u064A]+(\s+[\u0621-\u064A]+)*$/.test(v)) {
        return "يجب أن يحتوي الاسم على أحرف هجائية عربية فقط";
    }
    return "";
}

function validateNationalId(v) {
    if (v === "") { return "الرقم الوطني إلزامي"; }
    if (!/^\d{11}$/.test(v)) { return "يجب أن يتكون الرقم الوطني من 11 رقماً"; }
    var province = parseInt(v.substring(0, 2), 10);
    if (province < 1 || province > 14) {
        return "أول خانتين يجب أن تكونا بين 01 و 14 (المحافظة)";
    }
    return "";
}

function validateMobile(v) {
    if (v === "") { return ""; }
    v = v.replace(/\s+/g, "");
    /* Syriatel: 093 / 098 / 099 ، MTN: 094 / 095 / 096 */
    if (!/^(0|\+?963|00963)(93|98|99|94|95|96)\d{7}$/.test(v)) {
        return "رقم غير صحيح (يجب أن يطابق شبكتي Syriatel أو MTN مثل 0933123456)";
    }
    return "";
}

function validateEmail(v) {
    if (v === "") { return ""; }
    if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(v)) {
        return "البريد الإلكتروني غير صحيح";
    }
    return "";
}

function validateDates(startStr, endStr) {
    var errs = { start: "", end: "" };
    var s = null;
    var e = null;
    if (startStr === "") {
        errs.start = "تاريخ البداية إلزامي";
    } else {
        s = parseDate(startStr);
        if (s === null) { errs.start = "الصيغة المطلوبة yyyy-mm-dd وتاريخ حقيقي"; }
    }
    if (endStr === "") {
        errs.end = "تاريخ النهاية إلزامي";
    } else {
        e = parseDate(endStr);
        if (e === null) { errs.end = "الصيغة المطلوبة yyyy-mm-dd وتاريخ حقيقي"; }
    }
    if (s !== null && e !== null && e.getTime() <= s.getTime()) {
        errs.end = "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية";
    }
    return errs;
}

function setError(field, msg) {
    $("#err-" + field).text(msg);
    if (msg === "") { $("#" + field).removeClass("invalid"); }
    else { $("#" + field).addClass("invalid"); }
}

/* قراءة السيارات المختارة من الجدول */
function getSelectedCars() {
    var list = [];
    $(".selectbox:checked").each(function () {
        var row = $(this).closest("tr");
        list.push({
            code: $(this).val(),
            model: $.trim(row.find("td").eq(2).text()),
            price: parseInt(row.find("td").eq(4).text(), 10)
        });
    });
    return list;
}

/* بناء نافذة النتيجة وحساب المجموع والخصم */
function showResult(cars, days) {
    var total = 0;
    var html = "<table><thead><tr><th>السيارة</th><th>السعر اليومي</th><th>عدد الأيام</th><th>المجموع</th></tr></thead><tbody>";
    for (var i = 0; i < cars.length; i++) {
        var sub = cars[i].price * days;
        total += sub;
        html += "<tr><td class=\"ltr\">" + cars[i].code + " - " + cars[i].model + "</td><td>" +
                formatMoney(cars[i].price) + "</td><td>" + days + "</td><td>" + formatMoney(sub) + "</td></tr>";
    }
    var discount = 0;
    if (days > DISCOUNT_LIMIT_DAYS) {
        discount = total * DISCOUNT_RATE;
    }
    var finalAmount = total - discount;
    html += "<tr class=\"total\"><td colspan=\"3\">المجموع قبل الخصم</td><td>" + formatMoney(total) + "</td></tr>";
    html += "<tr class=\"total\"><td colspan=\"3\">الخصم" + (discount > 0 ? " (5% لأن المدة تتجاوز 10 أيام)" : " (لا يوجد)") + "</td><td>" + formatMoney(discount) + "</td></tr>";
    html += "<tr class=\"total\"><td colspan=\"3\">المبلغ النهائي</td><td>" + formatMoney(finalAmount) + "</td></tr>";
    html += "</tbody></table><p>عدد أيام التأجير لكل سيارة: <strong>" + days + "</strong> يوم</p>";
    $("#resultbody").html(html);
    $("#overlay").fadeIn(300);
}

/* ---------- ربط الأحداث باستخدام jQuery ---------- */
$(document).ready(function () {

    /* تأثير عام على جميع الصفحات */
    $("#maincontent").hide().fadeIn(700);
    $("#nav a").hover(function () { $(this).fadeTo(100, 0.75); }, function () { $(this).fadeTo(100, 1); });

    /* زر الخروج */
    $("#exitlink").click(function (ev) {
        ev.preventDefault();
        if (confirm("هل تريد الخروج من الموقع؟")) {
            window.close();
            window.location.href = "about:blank";
        }
    });

    /* صفحة من نحن: إظهار/إخفاء الأقسام */
    $(".collapsible h2").click(function () {
        $(this).next(".sectionbody").slideToggle(300);
    });

    /* صفحة السيارات: إظهار/إخفاء التفاصيل (يمكن إظهار عدة سيارات معاً) */
    $(".showdetails").change(function () {
        var row = $("#details-" + $(this).val());
        var inner = row.find(".detailsinner");
        if ($(this).is(":checked")) {
            row.show();
            inner.slideDown(300);
        } else {
            inner.slideUp(300, function () { row.hide(); });
        }
    });

    /* تمييز السيارة المختارة */
    $(".selectbox").change(function () {
        $(this).closest("tr").toggleClass("hl", $(this).is(":checked"));
    });

    /* زر متابعة */
    $("#continuebtn").click(function () {
        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#selectmsg").text("الرجاء اختيار سيارة واحدة على الأقل").fadeIn(200);
            return;
        }
        $("#selectmsg").hide();
        var names = [];
        for (var i = 0; i < cars.length; i++) { names.push(cars[i].model); }
        $("#chosenlist").text(names.join("، "));
        $("#bookingsection").slideDown(400);
        $("html, body").animate({ scrollTop: $("#bookingsection").offset().top }, 500);
    });

    /* إرسال النموذج */
    $("#bookingform").submit(function (ev) {
        ev.preventDefault();
        var name = $.trim($("#fullname").val());
        var nid = $.trim($("#nationalid").val());
        var mobile = $.trim($("#mobile").val());
        var email = $.trim($("#email").val());
        var startStr = $.trim($("#startdate").val());
        var endStr = $.trim($("#enddate").val());

        var eName = validateName(name);
        var eId = validateNationalId(nid);
        var eMob = validateMobile(mobile);
        var eMail = validateEmail(email);
        var eDates = validateDates(startStr, endStr);

        setError("fullname", eName);
        setError("nationalid", eId);
        setError("mobile", eMob);
        setError("email", eMail);
        setError("startdate", eDates.start);
        setError("enddate", eDates.end);

        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#selectmsg").text("الرجاء اختيار سيارة واحدة على الأقل").show();
            return;
        }
        if (eName !== "" || eId !== "" || eMob !== "" || eMail !== "" || eDates.start !== "" || eDates.end !== "") {
            return;
        }
        var days = daysBetween(parseDate(startStr), parseDate(endStr));
        showResult(cars, days);
    });

    $("#closeresult").click(function () { $("#overlay").fadeOut(200); });
});
