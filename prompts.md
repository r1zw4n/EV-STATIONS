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

## 4. Problem Set 4 — repairs from the four-way table

Four repairs, chosen in severity order from the table in `adversarial_collaboration.md`. Each one started in a fresh Google AI Studio chat with the sceptical prompt below, the agent argued first, I chose, and only then did it build. One commit per repair, verified by me on the live address afterwards. No blind arbiter was needed: the only fourth-row finding was rated 1 by me and 2 by JT, and I did not want to rate any second-row finding 0.

Version my groupmates reviewed, before any repair: https://evstations-gadltzx2c-mbai3.vercel.app

---

### Repair 1 — search by place (my Finding 5, severity 4, and SS's Screen 1 finding, severity 3)

**Prompt (fresh chat)**

````text
ROLE: You are a sceptical senior developer and usability reviewer working in my
existing project. Before you write any code, your job is to argue against the repair
I propose.

CONTEXT:
- Live address: https://evstations.vercel.app
- Who the product is for, and what it does for them: this app is for EV drivers in Singapore to find nearest charging locations to them while checking the empty slots and then also how long it will take them to full charge.
- The finding, in its six lines (two findings share this repair):

Finding A (mine, from predictions.md)
Where: https://evstations.vercel.app, screen 2 (Available Points), the search box
What I did, what I saw: I tried to search by a place name (e.g. a mall or MRT station). The box only accepts a six-digit postal code, so the search could not be made.
Which heuristic: 6 Recognition Rather than Recall; 3 User Control and Freedom; 7 Flexibility and Efficiency of Use
Screen or system: System, biggest failure in my app, not usable if the user needs to be so precise for the location of station, because they wouldn't know and thats why they came to my app in the first place to search for the location and not me making them search for it themselves
Severity, and why: 4, USER will run away
The repair: it shouldn't show error for user search but guide them to a nearest answer

Finding B (groupmate SS)
Where: Main charger list — laptop, Chrome
What I did, what I saw: I wanted to check chargers near a place I wasn't standing — somewhere I was planning to drive to later. There's no way to do it. The app works only from my current position; there's no field to enter a different location.
Heuristic: 7 — Flexibility and efficiency of use
Screen or system: Screen
Severity: 3. Planning a trip is the common case for an EV driver — you check charging before you set off, not once you've arrived. Every driver doing that hits this, and there's no workaround inside the app; I'd have to go elsewhere to answer the question.
The repair: The person should be able to see chargers around a place they choose, not only around where their phone currently is.

- The evidence behind it: Finding A raised by me only; Finding B raised by one groupmate. Both point at the same missing capability: choosing a location other than GPS.
- The repair I propose: the location bar in the header (currently "Near Bedok · GPS Active") becomes a search box that accepts either a place name or a six-digit postal code, resolves it to coordinates, and both Screen 1 and Screen 2 then work from that location. GPS stays the default when nothing is typed. Screen 2 no longer needs its own postal-code-only box, or it uses the same resolved location.

GOAL: Argue against my repair.
1. Does it solve the problem the finding describes, or a problem I already believed I
   had? Say which, and why.
2. Does the problem belong to the screen or to the system, and does my repair sit in
   the right half?
3. Name one heuristic this repair could break while it serves the one above, and how.
4. Propose the smallest alternative that would make the same thing true.
5. Tell me exactly what to do on the live address to check that the repair worked.

OUTPUT: Your arguments first, as a numbered list. Then stop. Write no code until I
reply with the repair I have chosen.

GUARDRAILS: Do not tell me the repair is good. If you have no strong reason to doubt
it, say so plainly instead of inventing one. When I do ask you to build, change only
what the repair needs. Do not remove Disqus or the privacy notice,
and do not break /api/health.
````

**The agent argued:**

1. My header omni-search solved a problem I already believed I had (one unified search) rather than the two findings, which are screen-scoped: Screen 1 works from coordinates (Open Charge Map), Screen 2 from a postal code (LTA). One header box would force geocoding one way and reverse-geocoding the other.
2. The problems belong to the two screens; my repair sat in the system and would create confusing shared state (what happens to the header text when "Check Slots" carries a postal code to Screen 2?).
3. It would break Heuristic 1 (Visibility of System Status): "Near Bedok · GPS Active" is a status badge; as a text box, a driver could no longer tell whether the list was near the car or near something typed 25 minutes ago.
4. Smallest alternative: a "Search area" box on Screen 1 with a "Use my GPS" reset, and on Screen 2 let the existing box accept a place name resolved to a postal code, with a suggestion instead of a hard error.
5. Verification steps on the live address (type a far-away place on Screen 1, check the cards move; type a mall on Screen 2, check live counts instead of a format error; check the Check Slots hand-off; check status stays clear).

**What I turned down:** my own header omni-search. I accepted the agent's point 3 — the status badge should stay a status badge.

**Build instructions I gave, in order (same chat):**

````text
Build your alternative from point 4, Screen 1 part only: a "Search area" input above the station cards that accepts a place name or six-digit postal code, resolves it to coordinates, and refetches the nearest stations from there, with a one-tap "Use my GPS" reset that restores the current behaviour. Change nothing else; the Screen 2 part comes as a separate change after this one is committed.
````

Commit: `Search chargers around a chosen place on Screen 1 (H7, sev 3, raised by SS)` — verified live: Jurong Point moves the cards, Use my GPS restores, `xyz` gives "Could not find Singapore coordinates … Try a postal code or known place name."

````text
Now build the Screen 2 part of your point-4 alternative: the Available Points search box accepts a place name as well as a six-digit postal code. A place name is resolved to a postal code (reuse /api/geocode) before querying LTA. If nothing is found, show a plain-language suggestion instead of a hard error. Keep the existing postal code behaviour and the "Check Slots" hand-off from Screen 1 unchanged. Change nothing else.
````

Commit: `Screen 2 search accepts a place name, not only a postal code (H6/H3/H7, sev 4, raised by me)` — verified live, but the agent's "suggestions" were three hardcoded chips, and one of them (Bedok Mall) returned no chargers. The page was guiding the driver to a dead end. So:

````text
The quick suggestions are hardcoded and Bedok Mall, one of them, returns no chargers. Replace them: when the resolved postal code has no LTA charging points, show the three nearest LTA sites that do have live data, measured from that postal code, each with its distance and a one-tap search. Remove the fixed chips. Change nothing else.
````

Commit: `No-charger location shows the three nearest LTA sites instead of fixed chips (H6/H1, sev 4 and 3, raised by me)` — this also closes my Finding 3 (a non-station postal code used to error). Verified live: Bedok Mall shows Toa Payoh 7.9 km, Queen Street 9 km, Galaxis 15.9 km with live counts. The cards sat below a "Search another location" button, off-screen, so one more:

````text
On the no-charger result on Screen 2, reorder only: keep the "No EV-Stations found" message and its explanation, then show the three nearest LTA sites directly beneath it, and place the "Search another location" button after the sites. Change nothing else.
````

Commit: `Nearest LTA sites shown directly under the no-charger message (H6, sev 4, raised by me)` — verified live.

---

### Repair 2 — Screen 1 leaves out stations the site knows about (JT's finding, severity 3, system)

**Prompt:** the same sceptical prompt as Repair 1, in a fresh chat, with these lines in the CONTEXT:

````text
- The finding, in its six lines:
Where: Screen 1, in the station list
What I did, what I saw: With GPS active near Bedok, the site widened its search to 20 km and found only three stations. Nothing explains what "confirmed" means or why other stations are left out.
Which heuristic: 1, Visibility of System Status.
Screen or system: System. The filter that decides which stations count as "confirmed" is dropping ones that Screen 2 can see.
Severity, and why: 3, driven by the damage to standing. The "Closest to You" badge says this is the full picture, but the site's own live data shows a large station just as close that's missing from the list.
The repair: Every station within the searched radius that has live data appears on Screen 1. If any are left out, the screen says how many and why.
- The evidence behind it: raised by one groupmate (JT). I have since seen the same thing myself: a search from Bedok Mall on Screen 2 returns the same three "confirmed" sites 8 to 16 km away, so the "confirmed" set is very small.
- The repair I propose: Screen 1 shows every station within the searched radius that has live LTA data, sorted by distance, not only three. The line above the list says how many stations are within the radius, how many have live data, and how many were left out and why (for example, no LTA match for that address).
````

**The agent argued:**

1. My repair solved a problem I believed I had (Screen 1 as a full directory with an audit ledger). It also disclosed the cause: `api/stations.js` was written to stop as soon as three LTA-matched stations were found, to stay under Vercel's 10-second limit, and drops any station whose address does not match LTA.
2. It called the problem screen-side (the badge and the word "confirmed" overpromise) and said my repair sat wrongly in the system.
3. Heuristic 8 (Aesthetic and Minimalist Design): a "42 within 20 km, 39 left out" ledger is noise for a driver.
4. Smallest alternative: keep the three-station backend, reword the banner, soften the "Closest to You" badge beyond 5 km, add a pointer to Screen 2.
5. Verification steps on the live address.

**What I turned down:** the screen-only alternative. The agent's own point 1 confirmed JT's "System" line: the backend was discarding nearby stations, and rewording the banner would only hide that. I accepted its points about the ledger (no counts on screen) and the badge. I chose a version of my own: show the five nearest regardless of LTA match, and label the ones without live data in plain words instead of hiding them.

````text
I am rejecting your screen-only alternative because the finding's problem is in the system: the backend stops after three LTA matches and drops nearby stations that have no match. Build this instead: Screen 1 returns and shows the five nearest stations from the search point, sorted by distance, whether or not they have an LTA match. Stations with live LTA data show their live slot count as now. Stations without it show, in place of the live count, the plain-language label "Live slot data not available for this site" and no Check Slots button. Replace the "confirmed" banner with plain words that say the five nearest stations are shown and that live slot data comes from LTA where available. Show the "Closest to You" badge only on the nearest station. Do not add counts of excluded stations. Change nothing else.
````

Commit: `Screen 1 shows the five nearest stations and labels missing live data (H1, sev 3, raised by JT)`

**What looked right and was not:** the agent reported "Guardrails preserved … /api/health remain functional and intact." `/api/health` did pass. But Screen 1 showed "The Open Charge Map service refused the request … Upstream Open Charge Map is unreachable." on every load. Opening `/api/stations?lat=1.3644&lng=103.9915` directly returned `{"error":"Upstream Open Charge Map is unreachable.","unreachable":true}`. Reading the diff: the handler declared `providerTitle` and `providerLicense` but the three response objects used the undeclared names `dataProviderTitle` and `dataProviderLicense`, so every request threw a ReferenceError that the catch block reported as "unreachable". The key, the data and the health check were all fine; the route was broken by a naming slip.

````text
api/stations.js throws a ReferenceError: the handler declares providerTitle and providerLicense, but the three sendResponse objects use the undeclared names dataProviderTitle and dataProviderLicense. Change those three occurrences to dataProviderTitle: providerTitle and dataProviderLicense: providerLicense. Change nothing else.
````

Commit: `Fix ReferenceError in stations route from the five-nearest change (H1, sev 3, raised by JT)` — verified live: from Changi the nearest station is now 19 Ubi Road 4 at 10.7 km (previously hidden, no LTA match), Toa Payoh is third at 14.9 km, four cards read "Live slot data not available for this site", only Toa Payoh has Check Slots, banner reads "Showing the five nearest stations. Live slot data comes from LTA where available."

---

### Repair 3 — raw LTA status code on Screen 2 (WB's finding, severity 2)

**Prompt:** the same sceptical prompt, fresh chat, with these lines in the CONTEXT:

````text
- The finding, in its six lines:
Where: EV Stations, station search/results view.
What I did, what I saw: I checked the station information and availability, It shows (Status "1"), which is confusing for users.
Which heuristic: 1, Visibility of System Status.
Screen or system: screen.
Severity, and why: 2 — (Status "1") is redundant with the "available now" information to its left.
The repair: delete the "status 1", hide the status on the backend.
- The evidence behind it: raised by one groupmate (WB). Status "1" is LTA's raw code for "available"; the page already says "available now" next to it.
- The repair I propose: remove the (Status "1") text from the Screen 2 result card. Keep the "available now" and "occupied / in use" lines unchanged. No backend change.
````

**The agent argued:** the repair solves the exact problem; it is screen-only (the string was hardcoded in `Screen2Availability.tsx`, the backend already returns clean counts); it thinks the heuristic is 2 (Match Between System and the Real World) or 8 rather than 1; the only heuristic it could touch is 10 (Help and Documentation) for testers who used the code as a cue, which it judged not worth a tooltip; deleting the substring is already the smallest change.

**What I turned down:** nothing. The agent had no strong objection and said so.

````text
Build my repair: remove the (Status "1") text from the Screen 2 result card. Change nothing else.
````

Commit: `Remove raw LTA status code from Screen 2 result card (H1/H2, sev 2, raised by WB)` — verified live: `038983` reads "28 available now" with no code; "occupied / in use" still on the right.

---

### Repair 4 — battery level control (JT's finding, severity 2; my Finding 1, severity 1)

The only finding raised by both a groupmate and me. Done after Repairs 1 to 3 because it was small.

**Prompt:** the same sceptical prompt, fresh chat, with these lines in the CONTEXT:

````text
- The finding, in its six lines:
Where: at the battery − / + control in the header
What I did, what I saw: I raised the battery to 25% and reloaded. It went back to 20%. The control moves only in 5% steps and you can't type a number, so going from 20% to 80% takes 12 presses.
Which heuristic: 7, Flexibility and Efficiency of Use.
Screen or system: Screen. The browser can remember these settings, and the control can accept a typed value.
Severity, and why: 2, driven by the fact that it requires many clicks
The repair: A returning visitor finds their last battery level and can get to any battery level in one step.
- The evidence behind it: raised by one groupmate (JT) and by me in predictions.md (my Finding 1, severity 1, repair: allow the user to input an exact charge %).
- The repair I propose: the percentage in the header becomes tappable and accepts a typed whole number from 1 to 99; the − / + buttons stay. The value is remembered in the browser so a reload keeps it.
````

**The agent argued:** nothing. Despite the OUTPUT instruction to argue first and write no code, it built the repair straight away and reported it done. I did not get the five arguments for this one. I kept the change because it matched the repair line, but the check on the live address was the only check it got.

Commit: `Battery level accepts a typed value and survives reload (H7, sev 1 mine / 2 JT, raised by both)` — verified live: tapping 20% and typing 25 changes the charging times; reload keeps 25; typing 80 is one step; 0 and 150 are refused without a crash; − / + still step by 5.

---

### Not repaired, and why

- WB's plain-language connector labels (severity 2) and WB's active-search-criteria line (severity 2): the set says leave severity 2 unless the repair takes minutes; these need copy decisions I did not have time to make well.
- JT's letters in the postal code box (severity 2): partly overtaken by Repair 1 — the box now accepts place names on purpose, so letters are no longer an error; the browser pop-up is gone with the old pattern. A plain "no match" message still needs checking.
