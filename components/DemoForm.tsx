"use client";

import { useState } from "react";

const COUNTRIES = [
  "Afghanistan (+93)","Albania (+355)","Algeria (+213)","Andorra (+376)","Angola (+244)","Antigua and Barbuda (+1268)","Argentina (+54)","Armenia (+374)","Aruba (+297)","Australia (+61)","Austria (+43)","Azerbaijan (+994)","Bahamas (+1242)","Bahrain (+973)","Bangladesh (+880)","Barbados (+1246)","Belarus (+375)","Belgium (+32)","Belize (+501)","Benin (+229)","Bhutan (+975)","Bolivia (+591)","Bosnia and Herzegovina (+387)","Botswana (+267)","Brazil (+55)","Brunei (+673)","Bulgaria (+359)","Burkina Faso (+226)","Burundi (+257)","Cambodia (+855)","Cameroon (+237)","Canada (+1)","Cape Verde (+238)","Central African Republic (+236)","Chad (+235)","Chile (+56)","China (+86)","Colombia (+57)","Comoros (+269)","Congo (Republic) (+242)","Congo (DRC) (+243)","Costa Rica (+506)","Cote d'Ivoire (+225)","Croatia (+385)","Cuba (+53)","Cyprus (+357)","Czech Republic (+420)","Denmark (+45)","Djibouti (+253)","Dominica (+1767)","Dominican Republic (+1809)","Ecuador (+593)","Egypt (+20)","El Salvador (+503)","Equatorial Guinea (+240)","Eritrea (+291)","Estonia (+372)","Eswatini (+268)","Ethiopia (+251)","Fiji (+679)","Finland (+358)","France (+33)","Gabon (+241)","Gambia (+220)","Georgia (+995)","Germany (+49)","Ghana (+233)","Greece (+30)","Grenada (+1473)","Guatemala (+502)","Guinea (+224)","Guinea-Bissau (+245)","Guyana (+592)","Haiti (+509)","Honduras (+504)","Hong Kong (+852)","Hungary (+36)","Iceland (+354)","India (+91)","Indonesia (+62)","Iran (+98)","Iraq (+964)","Ireland (+353)","Israel (+972)","Italy (+39)","Jamaica (+1876)","Japan (+81)","Jordan (+962)","Kazakhstan (+7)","Kenya (+254)","Kiribati (+686)","Kosovo (+383)","Kuwait (+965)","Kyrgyzstan (+996)","Laos (+856)","Latvia (+371)","Lebanon (+961)","Lesotho (+266)","Liberia (+231)","Libya (+218)","Liechtenstein (+423)","Lithuania (+370)","Luxembourg (+352)","Macau (+853)","Madagascar (+261)","Malawi (+265)","Malaysia (+60)","Maldives (+960)","Mali (+223)","Malta (+356)","Marshall Islands (+692)","Mauritania (+222)","Mauritius (+230)","Mexico (+52)","Micronesia (+691)","Moldova (+373)","Monaco (+377)","Mongolia (+976)","Montenegro (+382)","Morocco (+212)","Mozambique (+258)","Myanmar (+95)","Namibia (+264)","Nauru (+674)","Nepal (+977)","Netherlands (+31)","New Zealand (+64)","Nicaragua (+505)","Niger (+227)","Nigeria (+234)","North Korea (+850)","North Macedonia (+389)","Norway (+47)","Oman (+968)","Pakistan (+92)","Palau (+680)","Palestine (+970)","Panama (+507)","Papua New Guinea (+675)","Paraguay (+595)","Peru (+51)","Philippines (+63)","Poland (+48)","Portugal (+351)","Qatar (+974)","Romania (+40)","Russia (+7)","Rwanda (+250)","Saint Kitts and Nevis (+1869)","Saint Lucia (+1758)","Saint Vincent and the Grenadines (+1784)","Samoa (+685)","San Marino (+378)","Sao Tome and Principe (+239)","Saudi Arabia (+966)","Senegal (+221)","Serbia (+381)","Seychelles (+248)","Sierra Leone (+232)","Singapore (+65)","Slovakia (+421)","Slovenia (+386)","Solomon Islands (+677)","Somalia (+252)","South Africa (+27)","South Korea (+82)","South Sudan (+211)","Spain (+34)","Sri Lanka (+94)","Sudan (+249)","Suriname (+597)","Sweden (+46)","Switzerland (+41)","Syria (+963)","Taiwan (+886)","Tajikistan (+992)","Tanzania (+255)","Thailand (+66)","Timor-Leste (+670)","Togo (+228)","Tonga (+676)","Trinidad and Tobago (+1868)","Tunisia (+216)","Turkey (+90)","Turkmenistan (+993)","Tuvalu (+688)","Uganda (+256)","Ukraine (+380)","United Arab Emirates (+971)","United Kingdom (+44)","United States (+1)","Uruguay (+598)","Uzbekistan (+998)","Vanuatu (+678)","Vatican City (+379)","Venezuela (+58)","Vietnam (+84)","Yemen (+967)","Zambia (+260)","Zimbabwe (+263)",
];
const TIMEZONES = [
  "(UTC-11:00) Samoa, Niue","(UTC-10:00) Hawaii","(UTC-09:00) Alaska","(UTC-08:00) Los Angeles, Vancouver","(UTC-07:00) Denver, Phoenix","(UTC-06:00) Mexico City, Chicago, Guatemala","(UTC-05:00) New York, Bogota, Lima","(UTC-04:00) Caracas, Santiago","(UTC-03:00) Sao Paulo, Buenos Aires","(UTC-01:00) Azores, Cape Verde","(UTC+00:00) London, Lisbon, Dublin","(UTC+01:00) Madrid, Paris, Berlin","(UTC+02:00) Cairo, Athens, Johannesburg","(UTC+03:00) Moscow, Istanbul, Nairobi","(UTC+03:30) Tehran","(UTC+04:00) Dubai, Baku","(UTC+05:00) Karachi, Tashkent","(UTC+05:30) India, Sri Lanka","(UTC+06:00) Dhaka, Almaty","(UTC+07:00) Bangkok, Jakarta, Hanoi","(UTC+08:00) Singapore, Beijing, Manila","(UTC+09:00) Tokyo, Seoul","(UTC+10:00) Sydney, Melbourne","(UTC+12:00) Auckland, Fiji",
];

const T = {
  en: { fullName: "Full name", namePh: "Your name", email: "Email", emailPh: "you@email.com", countryLabel: "Where is your number from?", countryPh: "Select your country", phone: "Phone / WhatsApp number", phonePh: "Your number", age: "Age", agePh: "e.g. 28", daysLabel: "Which days work for you?", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], timeLabel: "What time of day?", times: ["Morning","Afternoon","Evening"], tzLabel: "Your time zone", tzPh: "Select your time zone", learnLabel: "I want to learn", learnEn: "English", learnEs: "Spanish", reasonLabel: "Why do you want to learn?", reasonPh: "A new job, moving abroad, travel, confidence...", submit: "Request my free demo", sending: "Sending...", fine: "No pressure, no commitment - a real teacher will reach out to schedule.", thanks: "Thank you", thanksMsg: "We've got your request and the times you're free. We'll email you shortly to lock in your free demo lesson.", err: "Something went wrong. Please try again." },
  es: { fullName: "Nombre completo", namePh: "Tu nombre", email: "Correo", emailPh: "tu@correo.com", countryLabel: "¿De qué país es tu número?", countryPh: "Selecciona tu país", phone: "Teléfono / WhatsApp", phonePh: "Tu número", age: "Edad", agePh: "p. ej. 28", daysLabel: "¿Qué días te vienen bien?", days: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"], timeLabel: "¿A qué hora del día?", times: ["Mañana","Tarde","Noche"], tzLabel: "Tu zona horaria", tzPh: "Selecciona tu zona horaria", learnLabel: "Quiero aprender", learnEn: "Inglés", learnEs: "Español", reasonLabel: "¿Por qué quieres aprender?", reasonPh: "Un nuevo trabajo, mudarte al extranjero, viajar, confianza...", submit: "Solicita tu clase gratis", sending: "Enviando...", fine: "Sin presión, sin compromiso: un profe real te contactará para agendar.", thanks: "¡Gracias", thanksMsg: "Recibimos tu solicitud y los horarios en los que estás libre. Te escribiremos pronto para agendar tu clase de prueba gratis.", err: "Algo salió mal. Inténtalo de nuevo." },
};

export default function DemoForm({ lang = "en" }: { lang?: "en" | "es" }) {
  const c = T[lang];
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("company")) { setStatus("done"); return; }
    setName(String(fd.get("name") || ""));
    const payload = {
      name: fd.get("name"), email: fd.get("email"), country: fd.get("country"), phone: fd.get("phone"),
      age: fd.get("age"), language: fd.get("language"), timezone: fd.get("timezone"),
      days: fd.getAll("days"), times: fd.getAll("times"), reason: fd.get("reason"),
    };
    try {
      const res = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setError(json.error || c.err); setStatus("error"); return; }
      setStatus("done");
    } catch { setError(c.err); setStatus("error"); }
  }

  if (status === "done") {
    return (
      <div className="demo-card demo-success" data-reveal>
        <div className="demo-check">&#10003;</div>
        <h3>{c.thanks}{name ? `, ${name.split(" ")[0]}` : ""}!</h3>
        <p>{c.thanksMsg}</p>
      </div>
    );
  }

  return (
    <form className="demo-card" onSubmit={onSubmit} data-reveal>
      <input type="text" name="company" className="demo-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="demo-grid">
        <div className="demo-field">
          <label htmlFor="d-name">{c.fullName}</label>
          <input id="d-name" name="name" type="text" required placeholder={c.namePh} />
        </div>
        <div className="demo-field">
          <label htmlFor="d-email">{c.email}</label>
          <input id="d-email" name="email" type="email" required placeholder={c.emailPh} />
        </div>

        <div className="demo-field demo-span">
          <label htmlFor="d-country">{c.countryLabel}</label>
          <select id="d-country" name="country" required defaultValue="">
            <option value="" disabled>{c.countryPh}</option>
            {COUNTRIES.map((co) => (<option key={co} value={co}>{co}</option>))}
          </select>
        </div>

        <div className="demo-field">
          <label htmlFor="d-phone">{c.phone}</label>
          <input id="d-phone" name="phone" type="tel" required placeholder={c.phonePh} />
        </div>
        <div className="demo-field">
          <label htmlFor="d-age">{c.age}</label>
          <input id="d-age" name="age" type="number" required min={5} max={99} placeholder={c.agePh} />
        </div>

        <div className="demo-field demo-span">
          <label>{c.daysLabel}</label>
          <div className="demo-chips">
            {c.days.map((d) => (<label className="demo-chip" key={d}><input type="checkbox" name="days" value={d} /> {d}</label>))}
          </div>
        </div>

        <div className="demo-field demo-span">
          <label>{c.timeLabel}</label>
          <div className="demo-chips">
            {c.times.map((tm) => (<label className="demo-chip" key={tm}><input type="checkbox" name="times" value={tm} /> {tm}</label>))}
          </div>
        </div>

        <div className="demo-field demo-span">
          <label htmlFor="d-tz">{c.tzLabel}</label>
          <select id="d-tz" name="timezone" required defaultValue="">
            <option value="" disabled>{c.tzPh}</option>
            {TIMEZONES.map((tz) => (<option key={tz} value={tz}>{tz}</option>))}
          </select>
        </div>

        <div className="demo-field demo-span">
          <label htmlFor="d-lang">{c.learnLabel}</label>
          <select id="d-lang" name="language" defaultValue="English">
            <option value="English">{c.learnEn}</option>
            <option value="Spanish">{c.learnEs}</option>
          </select>
        </div>

        <div className="demo-field demo-span">
          <label htmlFor="d-reason">{c.reasonLabel}</label>
          <textarea id="d-reason" name="reason" rows={4} required placeholder={c.reasonPh}></textarea>
        </div>
      </div>
      {status === "error" && <p className="demo-msg">{error}</p>}
      <button className="demo-submit" type="submit" disabled={status === "loading"}>{status === "loading" ? c.sending : c.submit}</button>
      <p className="demo-fine">{c.fine}</p>
    </form>
  );
}
