"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

// Your WhatsApp number (country code, no +, spaces or dashes):
const WHATSAPP = "971504296090";

// ▼▼▼ EDIT YOUR PAYMENT DETAILS HERE ▼▼▼
// For your Mexican community (bank transfer in pesos):
const PAY_MX = {
  bank: "BBVA Bancomer",
  name: "Samantha Lozano Hernández",
  account: "153 613 9998",
  clabe: "012 292 0153139998 2",
};
// For everyone else (Revolut transfer in US dollars):
const PAY_INTL = {
  beneficiary: "Jurgen Knechten",
  iban: "NL18 REVO 6063 0657 75",
  bic: "REVONL22",
  bank: "Revolut Bank UAB",
  corr: "CHASGB2L",
};
// ▲▲▲ EDIT YOUR PAYMENT DETAILS HERE ▲▲▲

export default function JoinMembership({ email }: { email: string }) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const router = useRouter();

  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
    } catch {}
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const t = lang === "es"
    ? {
        title: "¡Ya casi estás dentro!",
        sub: `Sesión iniciada como ${email}. Para desbloquear todo, activa tu membresía en 3 pasos:`,
        s1: "1. Paga con la opción de tu país",
        mxTitle: "Desde México", mxPrice: "$175 MXN el primer mes, luego $260 MXN/mes",
        intlTitle: "Desde otro país", intlPrice: "$10 USD el primer mes, luego $15 USD/mes",
        bankL: "Banco", nameL: "Nombre", accountL: "Cuenta", beneficiaryL: "Beneficiario", corrL: "BIC corresponsal",
        s2: "2. Envíanos tu comprobante", s2p: "Toca el botón y envía tu comprobante de pago por WhatsApp.",
        s3: "3. Activamos tu cuenta", s3p: "Tendrás acceso completo en unas horas. ¡Listo!",
        wa: "Ya pagué — confirmar por WhatsApp",
        waMsg: `¡Hola MundoLingu! Ya realicé mi pago de la membresía. Mi correo de registro es ${email}. Aquí está mi comprobante:`,
        logout: "Cerrar sesión",
      }
    : {
        title: "You're almost in!",
        sub: `Signed in as ${email}. To unlock everything, activate your membership in 3 steps:`,
        s1: "1. Pay with the option for your country",
        mxTitle: "From Mexico", mxPrice: "$175 MXN first month, then $260 MXN/month",
        intlTitle: "From another country", intlPrice: "$10 USD first month, then $15 USD/month",
        bankL: "Bank", nameL: "Name", accountL: "Account", beneficiaryL: "Beneficiary", corrL: "Correspondent BIC",
        s2: "2. Send us your receipt", s2p: "Tap the button and send your payment receipt on WhatsApp.",
        s3: "3. We activate your account", s3p: "You'll get full access within a few hours. That's it!",
        wa: "I've paid — confirm on WhatsApp",
        waMsg: `Hi MundoLingu! I've paid for the membership. My sign-up email is ${email}. Here's my receipt:`,
        logout: "Log out",
      };

  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.waMsg)}`;

  return (
    <div className="join-root">
      <div className="join-card">
        <div className="join-logo"><img src="/logo-emblem.png" alt="MundoLingu" /></div>
        <h1>{t.title}</h1>
        <p className="join-sub">{t.sub}</p>

        <p className="join-s1">{t.s1}</p>
        <div className="join-pay">
          <div className="join-method">
            <div className="join-method-head"><span className="join-flag">🇲🇽</span><h3>{t.mxTitle}</h3></div>
            <div className="join-method-price">{t.mxPrice}</div>
            <div className="join-bank">
              <div><span>{t.bankL}</span><b>{PAY_MX.bank}</b></div>
              <div><span>{t.nameL}</span><b>{PAY_MX.name}</b></div>
              <div><span>{t.accountL}</span><b>{PAY_MX.account}</b></div>
              <div><span>CLABE</span><b>{PAY_MX.clabe}</b></div>
            </div>
          </div>
          <div className="join-method">
            <div className="join-method-head"><span className="join-flag">🌎</span><h3>{t.intlTitle}</h3></div>
            <div className="join-method-price">{t.intlPrice}</div>
            <div className="join-bank">
              <div><span>{t.beneficiaryL}</span><b>{PAY_INTL.beneficiary}</b></div>
              <div><span>IBAN</span><b>{PAY_INTL.iban}</b></div>
              <div><span>BIC / SWIFT</span><b>{PAY_INTL.bic}</b></div>
              <div><span>{t.bankL}</span><b>{PAY_INTL.bank}</b></div>
              <div><span>{t.corrL}</span><b>{PAY_INTL.corr}</b></div>
            </div>
          </div>
        </div>

        <div className="join-steps">
          <div className="join-step"><h3>{t.s2}</h3><p>{t.s2p}</p></div>
          <div className="join-step"><h3>{t.s3}</h3><p>{t.s3p}</p></div>
        </div>

        <a className="join-wa" href={waHref} target="_blank" rel="noreferrer">
          <MessageCircle size={19} /> {t.wa}
        </a>
        <p className="join-logout"><a onClick={logout}>{t.logout}</a></p>
      </div>
    </div>
  );
}
