import { TERMS_CONTACT_EMAIL, TERMS_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/terms";

export const metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions for MundoLingu lessons, memberships and events.",
};

export default function TermsPage() {
  const hasTerms = TERMS_SECTIONS.length > 0;

  return (
    <div className="blog-root">
      <header className="blog-top">
        <a href="/" className="blog-logo"><img src="/logo-wordmark.png" alt="MundoLingu" /></a>
      </header>

      <article className="blog-article">
        <a className="blog-back" href="/">← Back to MundoLingu</a>
        <span className="blog-eyebrow">Legal</span>
        <h1 className="blog-title">Terms &amp; Conditions</h1>

        {TERMS_LAST_UPDATED ? <p className="terms-meta">Last updated: {TERMS_LAST_UPDATED}</p> : null}

        <div className="blog-body">
          {hasTerms ? (
            TERMS_SECTIONS.map((s, i) => (
              <section key={s.heading + i}>
                <h2>{s.heading}</h2>
                {(s.paragraphs || []).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {s.bullets && s.bullets.length ? (
                  <ul>
                    {s.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))
          ) : (
            <p>
              Our full Terms &amp; Conditions are being finalised and will be published on this page.
              In the meantime, please contact us at{" "}
              <a href={`mailto:${TERMS_CONTACT_EMAIL}`}>{TERMS_CONTACT_EMAIL}</a> with any questions
              about your membership, lessons or events.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
