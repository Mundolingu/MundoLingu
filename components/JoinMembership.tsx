"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

// Your WhatsApp number (country code, no +, spaces or dashes):
const WHATSAPP = "971504296090";

// ▼▼▼ EDIT YOUR PAYMENT DETAILS HERE ▼▼▼
const PAY = {
  bank: "BBVA Bancomer",
  name: "Samantha Lozano Hernández",
  account: "153 613 9998",
  clabe: "012 292 0153139998 2",
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
        sub: `Sesión iniciada como ${email}. Para desbloquear las clases, el calendario y los cuadernos, activa tu membresía en 3 pasos:`,
        price: "$10 el primer mes, luego $15/mes",
        s1: "1. Realiza tu pago", s1p: "Transfiere a nuestra cuenta:",
        bankL: "Banco", nameL: "Nombre", accountL: "Cuenta", clabeL: "CLABE",
        s2: "2. Envíanos tu comprobante", s2p: "Mándanos el comprobante por WhatsApp con el botón de abajo.",
        s3: "3. Activamos tu cuenta", s3p: "En unas horas te damos acceso completo. ¡Listo!",
        wa: "Ya pagué — confirmar por WhatsApp",
        waMsg: `¡Hola MundoLingu! Ya realicé mi pago de la membresía. Mi correo de registro es ${email}. Aquí está mi comprobante:`,
        logout: "Cerrar sesión",
      }
    : {
        title: "You're almost in!",
        sub: `Signed in as ${email}. To unlock the classes, calendar and workbooks, activate your membership in 3 steps:`,
        price: "$10 first month, then $15/mo",
        s1: "1. Make your payment", s1p: "Transfer to our account:",
        bankL: "Bank", nameL: "Name", accountL: "Account", clabeL: "CLABE",
        s2: "2. Send us your receipt", s2p: "Send your payment receipt on WhatsApp using the button below.",
        s3: "3. We activate your account", s3p: "We'll give you full access within a few hours. That's it!",
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
        <div className="join-price">{t.price}</div>

        <div className="join-steps">
          <div className="join-step">
            <h3>{t.s1}</h3>
            <p>{t.s1p}</p>
            <div className="join-bank">
              <div><span>{t.bankL}</span><b>{PAY.bank}</b></div>
              <div><span>{t.nameL}</span><b>{PAY.name}</b></div>
              <div><span>{t.accountL}</span><b>{PAY.account}</b></div>
              <div><span>{t.clabeL}</span><b>{PAY.clabe}</b></div>
            </div>
          </div>
          <div className="join-step">
            <h3>{t.s2}</h3>
            <p>{t.s2p}</p>
          </div>
          <div className="join-step">
            <h3>{t.s3}</h3>
            <p>{t.s3p}</p>
          </div>
        </div>

        <a className="join-wa" href={waHref} target="_blank" rel="noreferrer">
          <MessageCircle size={19} /> {t.wa}
        </a>
        <p className="join-logout"><a onClick={logout}>{t.logout}</a></p>
      </div>
    </div>
  );
}
