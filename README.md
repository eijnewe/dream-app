# dream-app

dream-app är en mobilapp för att hålla koll på personliga utgifter. Du skapar ett konto och kan sedan lägga till, visa, redigera och radera dina egna utgifter. Listan visar totalsumman i kronor. Kategorierna är Mat, Transport, Shopping och Övrigt.

Mobilappen finns i `mobile/`, backend i `backend/` och arbetsplanen i [PLAN.md](PLAN.md).

## Projektplan

Arbetet delades upp i att verifiera mobilmiljön, bygga autentisering, visa lista och detaljer, slutföra CRUD, testa hela flödet, dokumentera och göra en slutkontroll. [PLAN.md](PLAN.md) innehåller uppgifterna och deras status.

## Skisser

Skisserna visar skärmarnas innehåll och huvudsakliga åtgärder.

**Logga in**

```text
                Logga in          Tema
E-postadress    [                    ]
Lösenord        [                    ]
                [ Logga in           ]
                [ Skapa konto        ]
```

**Skapa konto**

```text
Tillbaka        Skapa konto       Tema
E-postadress    [                    ]
Lösenord        [                    ]
                [ Skapa konto        ]
                [ Till inloggning    ]
```

**Utgifter**

```text
Logga ut        Utgifter          Tema
[ Ny utgift                          ]
Totalt                       84,90 kr

Mat · Lunch                  49,90 kr
Transport · Bussbiljett      35,00 kr
```

**Utgiftsdetaljer**

```text
Till utgifter   Utgiftsdetaljer    Tema
49,90 kr
Mat
24 nov. 2026 12:30
Lunch

[ Redigera ]  [ Radera ]
```

**Utgiftsformulär**

```text
Tillbaka        Ny utgift         Tema
Belopp (kr)     [ 49,90              ]
Kategori        (•) Mat  ( ) Transport
                ( ) Shopping  ( ) Övrigt
Beskrivning     [ Lunch              ]
                [ Spara              ]
                [ Avbryt             ]
```

Samma formulär används vid redigering, med utgiftens uppgifter förifyllda.

## Datamodell

| Tabell | Fält |
| --- | --- |
| `users` | `id` (primärnyckel), `email` (unik), `password_hash` |
| `expenses` | `id` (primärnyckel), `user_id` (främmande nyckel), `amount`, `category`, `description`, `created_at` |

En användare kan ha flera utgifter. Varje utgift tillhör en användare genom `expenses.user_id`, som refererar till `users.id`. Om en användare tas bort raderar databasen även användarens utgifter. Backend använder användar-id:t från JWT för att begränsa åtkomsten till egna utgifter. PostgreSQL lagrar belopp som `NUMERIC(12, 2)`. Mobilappen hanterar att API:t kan returnera belopp som strängar. [Databasschema](backend/schema.sql)

## Teknikval

| Teknik | Motivering |
| --- | --- |
| React Native och Expo SDK 56 | En kodbas för mobilappen och möjlighet att testa i Expo Go på iOS-simulatorn. |
| Expo Router och TypeScript | Filbaserad navigering, skyddade skärmar och typer som beskriver API-data. |
| Gluestack UI | Återanvändbara komponenter och gemensamma färger för ljust och mörkt tema. |
| Node.js och Express | Ett enkelt HTTP-API för autentisering och utgifter. |
| PostgreSQL | Relationer mellan användare och utgifter samt decimaltyp för belopp. |
| bcryptjs, jsonwebtoken och Expo SecureStore | Hashning av lösenord, autentisering av skyddade API-anrop och säker lagring av JWT på mobilen. |
| GitHub Actions, Docker och Render | Automatiska tester och imagebyggen samt drift av API och databas oberoende av utvecklingsdatorn. |

## Installation och start

Installera Node.js 22 och npm. För iOS-simulatorn behövs macOS, Xcode och en Expo Go-version som stöder SDK 56. Projektägaren verifierade iOS 27.2 med Expo Go 56.0.4.

Kör från projektroten.

```sh
cd mobile
npm ci
npm run ios
```

För att starta Expo utan att öppna simulatorn direkt, kör `npm start` i `mobile/`. På en fysisk enhet behöver Expo Go stödja projektets SDK.

Mobilappen ansluter till det publika HTTPS-API:t på Render. Första anropet efter inaktivitet kan dröja på gratisplanen. Databasen på gratisplanen har begränsad livslängd. [API på Render](https://dream-app-backend-knll.onrender.com) · [Hälsokontroll](https://dream-app-backend-knll.onrender.com/health)

## Testning

Projektägaren genomförde den manuella testningen i steg 5 mot Render. Checklistan omfattar registrering, inloggning, utloggning, CRUD för egna utgifter, validering och felmeddelanden, laddning och tom lista, återkoppling vid ändringar samt formulär med öppet tangentbord. [Testplan](PLAN.md#5-testa-frontend-och-hela-användarflödet)

För att köra backendens automatiska API-tester från projektroten:

```sh
cd backend
npm ci
npm test
```

Det separata integrationstestet för CRUD och ägarskap körs med `npm run test:integration` från `backend/`. Det kräver en separat PostgreSQL-testdatabas med schemat installerat. Använd `.env.example` som mall för `backend/.env`, fyll i testdatabasens `DATABASE_URL` och ett lokalt `JWT_SECRET` och kör `npm run setup` före testet.

## CI/CD och Docker

GitHub Actions kör `npm ci`, `npm test` och bygger Docker-imagen för backend vid push och pull request. Vid push till `main`, till exempel efter en merge, anropar ett separat jobb Render via `RENDER_DEPLOY_HOOK` när test- och byggjobbet har passerat. Deploy-hooken lagras som en GitHub-hemlighet. [Workflow](.github/workflows/backend.yml)

Docker-imagen bygger på Node.js 22 Alpine, installerar produktionsberoenden och kör `npm start` som användaren `node`. Mobilutvecklingen använder Render direkt. [Dockerfile](backend/Dockerfile)

## Git-arbetsflöde och arbetsfördelning

1. Utveckla och testa ändringar på `dev`.
2. Öppna en pull request från `dev` till `main`.
3. Granska diffen och kontrollera resultatet från GitHub Actions.
4. Merga till `main` när ändringarna är redo och följ upp deploymenten på Render.

Projektägaren arbetar ensam och ansvarar för planering, implementation, manuell testning och dokumentation. Den genomförda kontroll som dokumenteras här är projektägarens manuella testning och de automatiska backendkontrollerna. Repo-historiken visar två tidigare mergeade pull requests från `dev`. [Pull request #1](https://github.com/eijnewe/dream-app/pull/1) · [Pull request #2](https://github.com/eijnewe/dream-app/pull/2)
