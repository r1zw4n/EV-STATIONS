# prompts.md

## 1. Creating a Fresh Front End Product for EV charging stations

For EV drivers in Singapore: an app called **SG CHARGING LOCATER** that shows the nearest 3 charging stations, the charging speed at each one, and how long a charge will take starting from 20% battery.

**Prompt**

````text
ROLE: You are an External User looking for EV charging spot.

GOAL: Build the front end of [EV STATIONS], a web product for [Users: EV owners
around Singapore]. Their job on this product is [See available stations, and
choose between option to find the fast charging or nearest one.]

Screens:

SCREEN 1 - To see where the nearest location is to them and how long is that
charging time based on their battery being at 20% charge right now.

SCREEN 2 - Number of AVAILABLE EV CHARGING POINTS which are not being used in
those two nearby locations.

OUTPUT: A running app. In dark theme. Keep every invented value in ONE data file
of its own, with at least 3 rows, so the screen looks real. One component per
screen or section. Move between screens without reloading the page. Readable on
a phone at arm's length. When you are done, list the files you created and what
each one holds.

GUARDRAILS: Screens and invented data only. Do NOT call the Gemini API or any
other model. Do NOT call any outside service or fetch from any URL. No database,
no login, no user accounts, no analytics. No features I did not list. No real
company's name, logo, or trademark. Invented names and numbers only, nothing
confidential.

CONTEXT: Individual Problem Set 2 for MGMT 6110 Human-AI Collaboration at SMU.
Built in Google AI Studio, shared as a link, and opened on a phone by classmates
in Week 3. I am not a programmer: when you make a choice I did not specify, say
so in one line rather than burying it.
````

**Came back with:** The front end with two screens, plus an extra tab with repeated information on Screen 1. I had to send follow-up prompts to remove those tabs.

**Came back with:** A function that called the endpoint from the browser, which the provider refuses. My prompt never said the call had to happen server-side.

**Action:** Rewrote the prompt with a guardrail. Kept the second version.

---

## 2. Prompt

**Prompt**

````text
In screen 1, remove the 'current ev state' tab and also the 'top 3 charging
stations' and the 'sort choice' tab as well. Change nothing else.
````

**Came back with:** Properly removed those tabs.

---

## 3. Backend without exposing the API key

Copy-pasted the prompt from Problem Set 2; the AI generated this prompt to let Google Gemini build a backend that keeps the API key out of the project.

**Prompt**

````text
ROLE: You are a senior full-stack developer working in my existing project. Do
not rewrite what is already there; add to it.

GOAL: My screen currently shows the list of the 3 nearest charging stations —
their names, addresses and charging speed in kW — as hard-coded values. Replace
it with real data from Open Charge Map, fetched through a serverless function of
my own.

1. api/stations.js — calls
   https://api.openchargemap.io/v3/poi/?output=json&countrycode=SG&latitude=1.3521&longitude=103.8198&distance=10&distanceunit=KM&maxresults=3&compact=false&verbose=false
   passing the key in an X-API-Key request header, never in the URL. It returns
   only the fields my screen needs — station id, title, address line, town,
   latitude, longitude, distance, the highest PowerKW across its connections,
   number of points, and the DataProvider title and licence for my footer — and
   nothing else. Accept optional lat and lng query parameters from my screen and
   pass them through to latitude and longitude, falling back to the Singapore
   centre values above.

2. api/health.js — reports whether the credential is configured (keyConfigured)
   and whether the upstream answered, including the HTTP status it returned. It
   must never print the credential or any part of it.

3. On the screen, replace the hard-coded station list with the live one, and
   decide what the user sees in each of these four cases: the data is loading,
   the data is empty, the upstream refused, and the upstream is unreachable. I
   want four different sentences, not one spinner.

   The "time to charge from 20%" figure stays a calculation done on my screen,
   but feed it the live PowerKW instead of the hard-coded speed.

   Screen 2 (available points not in use) stays exactly as it is on invented
   data. Open Charge Map does not publish live occupancy, so do not pretend that
   number is real and do not touch that screen.

OUTPUT: Both functions at api/ in the PROJECT ROOT, siblings of package.json,
never inside src/. If this project has a server entry file, register the same two
routes there too, because that is the shape the preview can answer. If it has no
server file, skip that and tell me so rather than inventing one.

Make sure package.json contains "type": "module".

BEFORE the fetch, if the credential is missing or empty, return 503 with a
message naming the variable, and do not call the upstream at all. A missing
variable is sent as the word "undefined" and looks exactly like a wrong
credential, so stop it early.

AFTER the fetch, check response.ok before reading the body. A refusal often has
an empty body, so calling .json() on it throws and my function dies with a 500
instead of telling me what happened. On a non-2xx reply, return the upstream
status and a one-line reason in your own JSON.

Cache the response for one hour with Cache-Control: s-maxage=3600,
stale-while-revalidate=7200 — the station registry changes rarely, so an hour is
generous and keeps me inside the free rate limit.

In the footer, credit the source in the exact form the provider's licence asks
for: "Charging location data from Open Charge Map — © Open Charge Map
Contributors, licensed CC BY 4.0", plus the DataProvider title returned for the
stations shown, since Open Charge Map requires the per-location data provider
attribution to be visible to the end user.

GUARDRAILS: Never write the credential into any file, comment or README. Never
create a variable whose name starts with VITE_. Never call the upstream from
browser code; every call happens inside api/. Never print the credential, or any
part of it, in a response or a log. No new npm packages. No database, no login.
Leave every screen I already have working exactly as it is.

CONTEXT: Deployed on Vercel from GitHub. The credential lives only in a Vercel
environment variable named OCM_API_KEY. A real response from the endpoint,
called by hand just now, looks like this:

[
  {
    "DataProvider": {
      "WebsiteURL": "http://openchargemap.org",
      "DataProviderStatusType": {
        "IsProviderEnabled": true,
        "ID": 1,
        "Title": "Manual Data Entry"
      },
      "IsRestrictedEdit": false,
      "IsOpenDataLicensed": true,
      "IsApprovedImport": true,
      "License": "Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)",
      "ID": 1,
      "Title": "Open Charge Map Contributors"
    },
    "OperatorInfo": {
      "WebsiteURL": "https://shellrecharge.com/en-us/solutions",
      "IsPrivateIndividual": false,
      "IsRestrictedEdit": false,
      "ID": 59,
      "Title": "Shell Recharge Solutions (US)"
    },
    "UsageType": {
      "IsPayAtLocation": false,
      "IsMembershipRequired": true,
      "IsAccessKeyRequired": true,
      "ID": 4,
      "Title": "Public - Membership Required"
    },
    "StatusType": {
      "IsOperational": true,
      "IsUserSelectable": true,
      "ID": 50,
      "Title": "Operational"
    },
    "SubmissionStatus": {
      "IsLive": true,
      "ID": 200,
      "Title": "Submission Published"
    },
    "IsRecentlyVerified": false,
    "DateLastVerified": "2017-10-06T09:21:00Z",
    "ID": 93730,
    "UUID": "ECBA849B-8885-483A-917D-0D59F6810EDB",
    "DataProviderID": 1,
    "OperatorID": 59,
    "UsageTypeID": 4,
    "AddressInfo": {
      "ID": 94076,
      "Title": "BCA Academy",
      "AddressLine1": "Braddell Road",
      "Town": "Toa Payoh",
      "StateOrProvince": "Central",
      "Postcode": "310221",
      "CountryID": 202,
      "Country": {
        "ISOCode": "SG",
        "ContinentCode": "AS",
        "ID": 202,
        "Title": "Singapore"
      },
      "Latitude": 1.343664,
      "Longitude": 103.857987,
      "Distance": 4.34743180637325,
      "DistanceUnit": 1
    },
    "Connections": [
      {
        "ID": 132701,
        "ConnectionTypeID": 1,
        "ConnectionType": {
          "FormalName": "SAE J1772-2009",
          "ID": 1,
          "Title": "Type 1 (J1772)"
        },
        "StatusTypeID": 50,
        "StatusType": {
          "IsOperational": true,
          "IsUserSelectable": true,
          "ID": 50,
          "Title": "Operational"
        },
        "LevelID": 2,
        "Level": {
          "Comments": "Over 2 kW, usually non-domestic socket type",
          "IsFastChargeCapable": false,
          "ID": 2,
          "Title": "Level 2 : Medium (Over 2kW)"
        },
        "CurrentTypeID": 10,
        "CurrentType": {
          "Description": "Alternating Current - Single Phase",
          "ID": 10,
          "Title": "AC (Single-Phase)"
        },
        "Quantity": 1
      }
    ],
    "NumberOfPoints": 1,
    "StatusTypeID": 50,
    "DateLastStatusUpdate": "2017-10-06T09:21:00Z",
    "DataQualityLevel": 1,
    "DateCreated": "2017-10-06T09:21:00Z",
    "SubmissionStatusTypeID": 200
  }
]
````

**Came back with:** *Unable to connect to Open Charge Map; the charging registry is currently unreachable.*

**Action:** Created an account on the Open Charge Map website, generated a real API key, pasted it into Vercel as an environment variable, then deployed and re-deployed.

**Lesson:** The app still shows as broken in Google AI Studio, but runs properly via Vercel — Vercel holds the key and fetches the real data.

