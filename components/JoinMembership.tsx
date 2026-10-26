"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Check, CreditCard, Tag, Lock, Loader2 } from "lucide-react";
import { CLUBS, CLUB_IDS, PROMO_CODE, PROMO_PERCENT, money, firstMonth, stripeHref, isClubId, type ClubId } from "@/lib/clubs";

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
// Prices, club names and what's included live in lib/clubs.ts

type Props = {
  email: string;
  userId?: string;
  justPaid?: boolean;
  referredBy?: string | null;
  owned?: ClubId[];
  preselect?: ClubId | null;
};

export default function JoinMembership({ email, userId, justPaid = false, referredBy = null, owned = [], preselect = null }: Props) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const available = CLUB_IDS.filter((id) => !owned.includes(id));
  const [club, setClub] = useState<ClubId>(preselect && available.includes(preselect) ? preselect : available[0] || "conversation");
  const router = useRouter();

  useEffect(() => {
    try {
      const s = localStorage.getItem("ml-lang");
      if (s === "es" || s === "en") setLang(s);
      else if (navigator.language && navigator.language.toLowerCase().startsWith("es")) setLang("es");
      // A club picked on the homepage before logging in.
      const picked = localStorage.getItem("ml-club-choice");
      if (!preselect && isClubId(picked) && available.includes(picked)) setClub(picked);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back from Stripe: Stripe tells our site a few seconds later, so keep checking.
  useEffect(() => {
    if (!justPaid) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [justPaid, router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const c = CLUBS[club];
  const name = c.name[lang];
  const price = `$${money(c.usd)} · ${money(c.aed)} AED`;
  const first = `$${firstMonth(c.usd)} · ${firstMonth(c.aed)} AED`;
  const card = stripeHref(c, email, userId);
  const isNew = owned.length === 0;

  const t = lang === "es"
    ? {
        title: isNew ? "¡Ya casi estás dentro!" : "Únete a otro club",
        sub: `Sesión iniciada como ${email}. Elige tu club, paga y te damos acceso en unas horas.`,
        s1: "1. Elige tu club",
        perMonth: "al mes",
        youreIn: "Ya estás dentro",
        promo: `${PROMO_PERCENT}% de descuento el primer mes con el código`,
        firstL: "Tu primer mes",
        thenL: "Después",
        card: "Pagar con tarjeta — seguro con Stripe",
        cardNote: "Tarjeta, Apple Pay o Google Pay. Tu club se activa al instante. Cancela cuando quieras.",
        s2card: "2. Paga de forma segura",
        paidT: "¡Pago recibido! Activando tu club…",
        paidP: "Esto tarda unos segundos. La página se actualiza sola.",
        help: "¿Preguntas? Escríbenos por WhatsApp",
        helpMsg: `¡Hola MundoLingu! Tengo una pregunta sobre el ${name}. Mi correo es ${email}.`,
        orBank: "o paga por transferencia bancaria",
        s2: "2. Paga por transferencia",
        mxTitle: "Desde México", mxPrice: "Paga el equivalente en pesos mexicanos",
        intlTitle: "Desde otro país", intlPrice: "Transferencia en dólares (USD)",
        bankL: "Banco", nameL: "Nombre", accountL: "Cuenta", beneficiaryL: "Beneficiario", corrL: "BIC corresponsal",
        s3: "3. Envíanos tu comprobante", s3p: "Toca el botón y envía tu comprobante por WhatsApp. Activamos tu club en unas horas.",
        wa: "Ya pagué — confirmar por WhatsApp",
        waMsg: `¡Hola MundoLingu! Ya pagué el ${name} (primer mes con el código ${PROMO_CODE}). Mi correo de registro es ${email}.${referredBy ? ` Me invitó un amigo (código ${referredBy}).` : ""} Aquí está mi comprobante:`,
        back: "Volver a mi club",
        logout: "Cerrar sesión",
      }
    : {
        title: isNew ? "You're almost in!" : "Join another club",
        sub: `Signed in as ${email}. Choose your club, pay, and we'll unlock it for you within a few hours.`,
        s1: "1. Choose your club",
        perMonth: "a month",
        youreIn: "You're in",
        promo: `${PROMO_PERCENT}% off your first month with code`,
        firstL: "Your first month",
        thenL: "Then",
        card: "Pay by card — secure with Stripe",
        cardNote: "Card, Apple Pay or Google Pay. Your club unlocks instantly. Cancel anytime.",
        s2card: "2. Pay securely",
        paidT: "Payment received! Unlocking your club…",
        paidP: "This takes a few seconds. The page refreshes by itself.",
        help: "Questions? Message us on WhatsApp",
        helpMsg: `Hi MundoLingu! I have a question about the ${name}. My email is ${email}.`,
        orBank: "or pay by bank transfer",
        s2: "2. Pay by bank transfer",
        mxTitle: "From Mexico", mxPrice: "Pay the same amount in Mexican pesos",
        intlTitle: "From another country", intlPrice: "Transfer in US dollars (USD)",
        bankL: "Bank", nameL: "Name", accountL: "Account", beneficiaryL: "Beneficiary", corrL: "Correspondent BIC",
        s3: "3. Send us your receipt", s3p: "Tap the button and send your payment receipt on WhatsApp. We'll unlock your club within a few hours.",
        wa: "I've paid — confirm on WhatsApp",
        waMsg: `Hi MundoLingu! I've paid for the ${name} (first month with code ${PROMO_CODE}). My sign-up email is ${email}.${referredBy ? ` I was invited by a friend (code ${referredBy}).` : ""} Here's my receipt:`,
        back: "Back to my club",
        logout: "Log out",
      };

  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.waMsg)}`;
  const helpHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t.helpMsg)}`;

  return (
    <div className="join-root">
      <div className="join-card join-card--wide">
        <div className="join-logo"><img src="/logo-emblem.png" alt="MundoLingu" /></div>
        {justPaid && (
          <div className="join-paid">
            <Loader2 size={20} className="join-spin" />
            <div><b>{t.paidT}</b><span>{t.paidP}</span></div>
          </div>
        )}
        <h1>{t.title}</h1>
        <p className="join-sub">{t.sub}</p>

        <p className="join-s1">{t.s1}</p>
        <div className="join-clubs" role="radiogroup">
          {CLUB_IDS.map((id) => {
            const k = CLUBS[id];
            const mine = owned.includes(id);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={club === id}
                disabled={mine}
                className={"join-club" + (club === id ? " on" : "") + (mine ? " mine" : "")}
                style={{ ["--club" as any]: k.color }}
                onClick={() => setClub(id)}
              >
                <span className="join-club-name">{k.name[lang]}</span>
                <span className="join-club-price">${money(k.usd)} <small>/ {money(k.aed)} AED</small></span>
                <span className="join-club-per">{mine ? (<><Check size={13} /> {t.youreIn}</>) : t.perMonth}</span>
              </button>
            );
          })}
        </div>

        <div className="join-detail">
          <p className="join-detail-for">{c.for[lang]}</p>
          <ul>
            {c.includes[lang].map((li) => (<li key={li}><Check size={15} /> {li}</li>))}
          </ul>
          <div className="join-promo">
            <Tag size={15} /> {t.promo} <b>{PROMO_CODE}</b>
          </div>
          <div className="join-sum">
            <div><span>{t.firstL}</span><b>{first}</b></div>
            <div><span>{t.thenL}</span><b>{price} <small>{t.perMonth}</small></b></div>
          </div>
        </div>

        {card ? (
          <>
            <p className="join-s1">{t.s2card}</p>
            <a className="join-card-btn" href={card}><CreditCard size={18} /> {t.card}</a>
            <p className="join-card-note"><Lock size={13} /> {t.cardNote}</p>
            <a className="join-help" href={helpHref} target="_blank" rel="noreferrer">
              <MessageCircle size={15} /> {t.help}
            </a>
          </>
        ) : (
          <>
            {/* Shown only while this club has no Stripe link set up yet. */}
            <p className="join-s1">{t.s2}</p>
            <div className="join-pay">
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
            </div>
            <div className="join-steps">
              <div className="join-step"><h3>{t.s3}</h3><p>{t.s3p}</p></div>
            </div>
            <a className="join-wa" href={waHref} target="_blank" rel="noreferrer">
              <MessageCircle size={19} /> {t.wa}
            </a>
          </>
        )}
        <p className="join-logout">
          {!isNew && (<><a href="/members">{t.back}</a>{" · "}</>)}
          <a onClick={logout}>{t.logout}</a>
        </p>
      </div>
    </div>
  );
}
