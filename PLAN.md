# Plan för dream-app

dream-app är ett enmansprojekt för att hantera personliga utgifter. Mobilappen använder Expo SDK 56, Expo Router, TypeScript och Gluestack UI. API:t och PostgreSQL körs på Render. Backend och dess CI/CD är redan testade.

Testa resultatet efter varje numrerat steg innan arbetet går vidare.

## 1. Verifiera att mobilappen startar

- [x] Verifiera att det befintliga Expo SDK 56-projektet startar i iOS-simulatorn.
- [x] Dokumentera fungerande körsätt. Projektägaren verifierade iOS 27.2 med Expo Go 56.0.4 (`host.exp.Exponent`).

## 2. Bygg inloggning, registrering och utloggning

- [x] Lägg till gemensam API-hantering för Render. Spara JWT säkert på enheten och rensa sessionen vid utloggning eller när API:t avvisar token vid sessionskontroll.
- [x] Bygg Login och Register med Gluestack, validering enligt API:t, laddningsstatus, tydliga fel, e-posttangentbord och säkra lösenordsfält.
- [x] Lägg till sessionskontroll i `mobile/app/_layout.tsx` och styr startsidan till Login eller Expenses. Uppdatera startmallens appnamn, slug och URL-schema i `mobile/app.json`.
- [x] Testa registrering, inloggning, återställd session efter omstart och utloggning. Projektägaren bekräftade att testpunkterna är klara.

## 3. Visa utgiftslista och detaljer

- [x] Bygg Expenses med `GET /expenses`, totalsumma och kategorierna Mat, Transport, Shopping och Övrigt. Hantera att PostgreSQL kan returnera `amount` som en sträng.
- [x] Visa laddningsläge, tom lista och fel med möjlighet att försöka igen.
- [x] Bygg Expense details med `GET /expenses/:id` och visa ett tydligt meddelande när en utgift inte går att hämta.
- [ ] Testa listan med och utan utgifter, totalsumman och navigeringen till detaljvyn. Kontrollera laddningsläget vid första anropet efter att Render varit inaktivt.

## 4. Skapa, redigera och radera utgifter

- [x] Bygg Expense form som en egen skärm med samma formulär för skapande (`POST /expenses`) och redigering (`PUT /expenses/:id`). Listan, detaljvyn och formuläret ger tre skärmar utöver autentisering.
- [x] Validera belopp, kategori och beskrivning enligt [backendens regler](backend/server.js). Acceptera exempelvis `12,50` i formuläret och skicka beloppet som ett tal.
- [x] Bekräfta radering i en dialog före `DELETE /expenses/:id`. Visa återkoppling vid lyckat sparande och radering, visa fel vid misslyckade anrop och uppdatera listan och totalsumman efter ändringar.
- [x] Testa skapande, redigering, avbruten och bekräftad radering, uppdaterad totalsumma och formuläret med öppet tangentbord. Projektägaren bekräftade att flödet fungerar.

## 5. Testa frontend och hela användarflödet

Projektägaren bekräftade att den manuella testningen mot Render är klar.

- Testa appen i iOS-simulator eller på fysisk mobil mot backend på Render.
- Kontrollera registrering, inloggning och utloggning.
- Kontrollera att det går att skapa, läsa, redigera och radera egna utgifter.
- Kontrollera formulärvalidering och felmeddelanden.
- Kontrollera loading, empty och error states.
- Kontrollera återkoppling vid sparande och radering.
- Kontrollera att formulären är tangentbordsvänliga.

## 6. Dokumentera projektet och följ upp arbetet

- [x] Använd `PLAN.md` som arbetsdokumentation. Uppdatera checklistan när uppgifter påbörjas eller slutförs.
- [x] Skapa `README.md` med:
  - Projektbeskrivning och projektplan.
  - Skisser för de fem skärmarna.
  - Datamodell och relationer mellan användare och utgifter.
  - Teknikval och motivering.
  - Instruktioner för installation, start och testning.
  - Publik HTTPS-adress till backend.
  - Beskrivning av CI/CD och Docker.
  - Arbetsfördelning som enmansprojekt.
- [x] Dokumentera Git-flödet från `dev` via pull request till `main`, inklusive automatiska kontroller och genomförd granskning.

## 7. Slutkontroll inför inlämning

- [ ] Kontrollera att samtliga obligatoriska skolkrav är uppfyllda.
- [ ] Kontrollera att backend och databas fungerar oberoende av den lokala datorn.
- [ ] Kontrollera att GitHub Actions och automatisk deployment fungerar.
- [ ] Kontrollera att inga hemligheter finns i Git.
- [ ] Säkerställ att läraren har tillgång till repository med `README.md` och `PLAN.md`.
- [ ] Merga den färdiga koden till `main` via pull request.
