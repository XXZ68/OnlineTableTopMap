import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../atoms/Button'
import Modal from '../atoms/Modal'

type AGBsProps = {
  isOpen: boolean
  onClose: () => void
}

type AGBtextProps = {
  isOpen: boolean
  onClose: () => void
}

export function AGBs({ isOpen, onClose }: AGBsProps) {
  const navigate = useNavigate()
  const [showAGBs, setShowAGBs] = useState(false)

  const handleAcceptance = (event: FormEvent) => {
    event.preventDefault()

    console.log('Sucker accepted, let him into his account')
    onClose()
    navigate('/profile')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        Before you continue please take a minute to review and understand our
        Terms of Service. Otherwise our Lawyers will explain it to you.
      </div>

      <div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAGBs(true)}
        >
          Link to AGBs
        </Button>

        <Button variant="secondary" size="sm">
          Pay another 1€🫠
        </Button>
      </div>

      <Button variant="primary" onClick={handleAcceptance}>
        I have read and accept the Terms & Conditions
      </Button>

      <AGBtext
        isOpen={showAGBs}
        onClose={() => setShowAGBs(false)}
      />
    </Modal>
  )
}

export function AGBtext({ isOpen, onClose }: AGBtextProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Scrollable Container with custom styling */}
      <div className="max-h-[65vh] overflow-y-auto pr-4 text-sm leading-relaxed scrollbar-thin">
        {/* Header */}
        <h2 className="text-xl font-bold border-b pb-3 mb-6">
          Allgemeine Geschäftsbedingungen (AGB)
        </h2>

        <div className="space-y-6">
          {/* § 1 */}
          <section>
            <h3 className="font-semibold text-base mb-2">
              § 1 Geltungsbereich und Anbieter
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Diese Allgemeinen Geschäftsbedingungen
              (nachfolgend „AGB“) gelten für alle Verträge, die zwischen der
            </p>

            {/* Company Info Box */}
            <div className="border border-slate-200 rounded-lg p-3 my-3 text-xs space-y-1">
              <div className="font-semibold text-sm mb-1">
                Musterunternehmen GmbH
              </div>
              <div>Musterstraße 123, 10115 Berlin</div>
              <div>Amtsgericht Charlottenburg, HRB 123456</div>
              <div>Geschäftsführer: Max Mustermann</div>
              <div>
                E-Mail:{' '}
                <span className="text-blue-600">
                  kontakt@musterunternehmen.de
                </span>
              </div>
              <div className="italic mt-1">(nachfolgend „Anbieter“)</div>
            </div>

            <p className="mb-2">
              und dem Kunden (nachfolgend „Nutzer“ oder „Kunde“) über die
              Webseite bzw. Plattform des Anbieters geschlossen werden.
            </p>

            <p className="mb-2">
              <strong>(2)</strong> Kunde im Sinne dieser AGB können sowohl
              Verbraucher als auch Unternehmer sein:
            </p>

            <ul className="list-disc pl-5 space-y-2 mt-1">
              <li>
                <span className="font-semibold text-slate-800">
                  Verbraucher
                </span>{' '}
                ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken
                abschließt, die überwiegend weder ihrer gewerblichen noch ihrer
                selbständigen beruflichen Tätigkeit zugerechnet werden können
                (§ 13 BGB).
              </li>

              <li>
                <span className="font-semibold text-slate-800">
                  Unternehmer
                </span>{' '}
                ist eine natürliche oder juristische Person oder eine
                rechtsfähige Personengesellschaft, die bei Abschluss eines
                Rechtsgeschäfts in Ausübung ihrer gewerblichen oder
                selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).
              </li>
            </ul>

            <p className="mt-2">
              <strong>(3)</strong> Abweichende, entgegenstehende oder
              ergänzende Geschäftsbedingungen des Nutzers werden nur dann
              Vertragsbestandteil, wenn der Anbieter ihrer Geltung ausdrücklich
              schriftlich zugestimmt hat.
            </p>
          </section>

          {/* § 2 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 2 Vertragsschluss
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Die Darstellung der Angebote und Leistungen
              auf der Webseite stellt kein rechtlich bindendes Angebot, sondern
              eine unverbindliche Aufforderung zur Abgabe einer Bestellung dar.
            </p>

            <p className="mb-2">
              <strong>(2)</strong> Durch das Anklicken des Buttons
              „Zahlungspflichtig bestellen“ bzw. „Kostenpflichtig registrieren“
              gibt der Kunde ein verbindliches Angebot zum Abschluss des
              jeweiligen Vertrages ab.
            </p>

            <p>
              <strong>(3)</strong> Der Vertrag kommt zustande, sobald der
              Anbieter das Angebot des Kunden durch eine Auftragsbestätigung
              per E-Mail oder durch Freischaltung des Zugangs bzw.
              Bereitstellung der Leistung annimmt.
            </p>
          </section>

          {/* § 3 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 3 Leistungen und Verfügbarkeit
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Der Umfang der geschuldeten Leistungen ergibt
              sich aus der jeweiligen Leistungsbeschreibung zum Zeitpunkt der
              Bestellung.
            </p>

            <p>
              <strong>(2)</strong> Der Anbieter bemüht sich um eine möglichst
              unterbrechungsfreie Verfügbarkeit seiner Dienste. Notwendige
              Wartungsarbeiten, Sicherheitsupdates oder Umstände außerhalb des
              Einflussbereichs des Anbieters (z. B. höhere Gewalt, Störungen von
              Telekommunikationsnetzen) können jedoch zu vorübergehenden
              Einschränkungen führen.
            </p>
          </section>

          {/* § 4 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 4 Vergütung, Zahlungsbedingungen und Verzug
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Es gelten die zum Zeitpunkt der Bestellung
              angegebenen Preise. Alle Preise verstehen sich inklusive der
              gesetzlich gültigen Mehrwertsteuer, sofern nicht ausdrücklich als
              Nettopreis ausgewiesen.
            </p>

            <p className="mb-2">
              <strong>(2)</strong> Die Zahlung erfolgt über die im
              Bestellprozess angegebenen Zahlungsmethoden (z. B. Kreditkarte,
              PayPal, SEPA-Lastschrift oder Rechnung).
            </p>

            <p>
              <strong>(3)</strong> Der Rechnungsbetrag ist, sofern nicht anders
              vereinbart, sofort mit Vertragsschluss zur Zahlung fällig. Kommt
              der Kunde in Zahlungsverzug, gelten die gesetzlichen
              Verzugsregeln.
            </p>
          </section>

          {/* § 5 */}
          <section className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 text-base mb-2 text-rose-800">
              § 5 Widerrufsrecht für Verbraucher
            </h3>

            <p className="mb-3">
              Ist der Kunde Verbraucher, steht ihm grundsätzlich ein
              gesetzliches Widerrufsrecht zu.
            </p>

            <div className="border-l-2 border-rose-500 pl-3 space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">
                Widerrufsbelehrung
              </h4>

              <p>
                <strong>Widerrufsrecht:</strong> Sie haben das Recht, binnen
                vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
                widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag
                des Vertragsschlusses bzw. bei Warenlieferung ab dem Tag, an
                dem Sie oder ein von Ihnen benannter Dritter die Ware in Besitz
                genommen haben.
              </p>

              <div className="text-xs bg-white border rounded p-2 text-slate-600">
                <span className="font-semibold block text-slate-800 mb-1">
                  Empfänger für den Widerruf:
                </span>
                Musterunternehmen GmbH
                <br />
                Musterstraße 123, 10115 Berlin
                <br />
                E-Mail:{' '}
                <span className="text-blue-600">
                  widerruf@musterunternehmen.de
                </span>
              </div>

              <p>
                Mittels einer eindeutigen Erklärung (z. B. ein mit der Post
                versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen
                Vertrag zu widerrufen, informieren.
              </p>

              <p>
                <strong>Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag
                widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
                erhalten haben, unverzüglich und spätestens binnen vierzehn
                Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
                Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für
                diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das
                Sie bei der ursprünglichen Transaktion eingesetzt haben.
              </p>

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 italic">
                <strong>Besonderer Hinweis bei digitalen Inhalten:</strong> Das
                Widerrufsrecht erlischt vorzeitig, wenn die Bereitstellung
                digitaler Inhalte mit Ihrer ausdrücklichen Zustimmung vor
                Ablauf der Widerrufsfrist begonnen hat und Sie bestätigt haben,
                dass Sie dadurch Ihr Widerrufsrecht verlieren.
              </p>
            </div>
          </section>

          {/* § 6 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 6 Gewährleistung und Haftungsbeschränkung
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Es gelten die gesetzlichen
              Mängelgewährleistungsrechte.
            </p>

            <p className="mb-2">
              <strong>(2)</strong> Der Anbieter haftet unbeschränkt für Vorsatz
              und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des
              Lebens, des Körpers oder der Gesundheit.
            </p>

            <p className="mb-2">
              <strong>(3)</strong> Bei leicht fahrlässiger Verletzung
              wesentlicher Vertragspflichten (Kardinalpflichten) ist die
              Haftung der Höhe nach auf den bei Vertragsschluss vorhersehbaren,
              vertragstypischen Schaden begrenzt. Wesentliche Vertragspflichten
              sind solche, deren Erfüllung die ordnungsgemäße Durchführung des
              Vertrages überhaupt erst ermöglicht.
            </p>

            <p>
              <strong>(4)</strong> Im Übrigen ist die Haftung des Anbieters –
              gleich aus welchem Rechtsgrund – ausgeschlossen.
            </p>
          </section>

          {/* § 7 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 7 Urheberrechte und Nutzungsrechte
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Sämtliche Inhalte, Logos, Grafiken, Texte
              und Software des Anbieters sind urheberrechtlich geschützt.
            </p>

            <p>
              <strong>(2)</strong> Der Kunde erhält an den Inhalten und
              Diensten lediglich ein einfaches, nicht übertragbares und nicht
              unterlizenzierbares Recht zur Nutzung im vertraglich vereinbarten
              Umfang.
            </p>
          </section>

          {/* § 8 */}
          <section>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 8 Datenschutz
            </h3>

            <p>
              Die Erhebung, Verarbeitung und Nutzung personenbezogener Daten
              erfolgt ausschließlich im Rahmen der gesetzlichen Bestimmungen
              (insbesondere DSGVO und BDSG). Ausführliche Angaben finden sich in
              der separaten Datenschutzerklärung des Anbieters.
            </p>
          </section>

          {/* § 9 */}
          <section className="pb-6">
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              § 9 Schlussbestimmungen
            </h3>

            <p className="mb-2">
              <strong>(1)</strong> Es gilt das Recht der Bundesrepublik
              Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Bei
              Verbrauchern gilt diese Rechtswahl nur insoweit, als nicht
              zwingende Verbraucherschutzvorschriften des Staates, in dem der
              Verbraucher seinen gewöhnlichen Aufenthalt hat, entzogen werden.
            </p>

            <p className="mb-2">
              <strong>(2)</strong> Ist der Kunde Kaufmann, eine juristische
              Person des öffentlichen Rechts oder ein öffentlich-rechtliches
              Sondervermögen, ist ausschließlicher Gerichtsstand für alle
              Streitigkeiten der Sitz des Anbieters.
            </p>

            <p>
              <strong>(3)</strong> Sollten einzelne Bestimmungen dieses
              Vertrages ganz oder teilweise unwirksam oder undurchführbar sein
              oder werden, berührt dies die Wirksamkeit der übrigen
              Bestimmungen nicht (Salvatorische Klausel). Anstelle der
              unwirksamen Regelung treten die gesetzlichen Vorschriften.
            </p>
          </section>
        </div>
      </div>

      {/* Bottom Actions inside Modal */}
      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="primary" onClick={onClose}>
          Schließen
        </Button>
      </div>
    </Modal>
  )
}