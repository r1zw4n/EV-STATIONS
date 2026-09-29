# adversarial_collaboration.md

Rizwan Khan, Group 8
predictions.md committed at Saturday 26 September 2026, 10:26 AM; first comment for this set on my board at Monday 28 September 2026, 12:16 AM

---

## The four-way table

### 1. Found by both
- None

### 2. Found by them, missed by me
- No way to check chargers near a place I am not standing, Screen 1 has no field to enter a different location | raised by SS (Vidhya) | theirs 3 | arbiter NOT TAKEN
- Postal code box on Screen 2 accepts letters, and the only feedback is the browser pop-up "Please match the format requested." | raised by JT (Janelle) | theirs 2 | arbiter NOT TAKEN
- Screen 1 "nearest" list leaves out stations that Screen 2 can see, because of the "confirmed" filter | raised by JT (Janelle) | theirs 3 | arbiter NOT TAKEN
- Screen 2 shows (Status "1") beside "available now", which is confusing and redundant | raised by WB (Beichao) | theirs 2 | arbiter NOT TAKEN
- Charging and connector information is not explained in plain language, so a first-time EV user may not know which is relevant to their vehicle | raised by WB (Beichao) | theirs 2 | arbiter NOT TAKEN
- After a search, the active location or search criteria is not kept prominent above the results | raised by WB (Beichao) | theirs 2 | arbiter NOT TAKEN

### 3. Found by me, not by them
- Screen 2 opens on the default postal code 038983 instead of the three nearest stations from Screen 1 | my severity 3
- A valid postal code that is not the exact location of a known station returns an error instead of the nearest stations | my severity 3 to 4
- No way to reach a station's slots from Screen 2 directly, only through "Check slots" on Screen 1 | my severity 3
- Screen 2 search accepts only a six-digit postal code, not a place name | my severity 4

### 4. Found by both, rated differently
- Battery percentage control in the header: moves only in 5% steps, no typed value, resets on reload | raised by JT (Janelle) | my severity 1, theirs 2 | arbiter NOT TAKEN
  (Heuristic differs: I put it under 3 User Control and Freedom, JT (Janelle) under 7 Flexibility and Efficiency of Use.)

---

## My predictions, checked

- Expected finding 1 (battery control, severity 0 to 1): HELD, JT (Janelle) gave 2 beside the 0 to 1 I expected, because she raised the same control with the same repair, typing a number.
- Expected finding 2 (non-station postal code errors, severity 3): BROKE, because nobody raised it.
- Expected finding 3 (no route from Screen 2 to a Screen 1 station, severity 3): BROKE, because nobody raised it.
- The heuristic I named as my product's worst (7, Flexibility and Efficiency of Use): HELD, because two of the four groupmate findings fell under 7, more than under any other heuristic.
- The finding that would show my evaluation was wrong: I wrote "None". NOT RAISED as written, because I named no finding, but the second row holds three findings I missed, so the prediction itself was the weak point.

---

## Q1. Where was confirmation bias in my own evaluation?

- Couple of confirmation bias actually, first one was the major one. My app was designed to show USER nearest EV stations for live location to them based on GPS ( meaning nearest to me). But if someone wanted to find charger in a ldestination they are going later, they will have to reach that spot and then can only see EV chargers. Biggest failure of my app. Pointed by team mate Vidhya and predicted by me in #4.
- second , the current charge % of USER moved only in +- multiple of 5, could not manually input number and so required many clicks to reach actual number for user. Predicted in#1 Findings and pointed out by Janelle.

The trace I can quote from `predictions.md` is my third prediction: *"None, because those are genuine failures, there no way those issues will work for user."* I had written a prediction that nothing could contradict. I found it when I built row 2 of the four-way table and it held six findings I had not made, from all three groupmates.

---

## Q2. Which prediction broke, and what did it teach me?

The screen 2 did not initially allow for searching for a random postcode for available slots search, I could only reach that search after going back to screen1 and clicking from nearest location tab. Searching in screen 2 directly gave error. Nobody from my group caught that.

I had expected this at severity 3 (expected findings 2 and 3 in my predictions). It broke because my groupmates reached Screen 2 the way the app leads them, by pressing Check Slots on Screen 1, so the postal code box was already filled in when they got there; typing a random postal code into Screen 2 is something only the builder does, because only the builder knows the two screens are separate. What it taught me is that the findings I predict are the ones I already know about, and users find the ones that start from a different place than mine.

---

## Q3. Which groupmate finding did I nearly dismiss, and what did the evidence say?

Beichao (Bryan's) finding, he found an issue on screen two, where a valid search status showed a random machine generated "status 1" tab. Which meant search valid. But for a user that number is meaningless and not understandable. I still couldn't find it even after being pointed out.
Eventually changed it.

I did not take it to the arbiter. What settled it was my own Screen 2 screenshot from Step 5: under the connector count the line read *28 available now (Status "1")*. Status "1" is LTA's raw code for "available", printed next to the plain word that already says it. Once I saw it on the live address I could not un-see it, and it became Repair 3.

---

## Q4. What did I revise, which heuristic does it serve, and how do I know it worked?

what you revised. Four repairs, seven-plus commits; before https://evstations-gadltzx2c-mbai3.vercel.app, after https://evstations.vercel.app. All of it is in prompts.md

Version my groupmates reviewed, before any repair: https://evstations-gadltzx2c-mbai3.vercel.app (screenshots of Screen 1 and Screen 2 taken Monday 28 September 2026, 3:15 AM). Live address after the revision: https://evstations.vercel.app

| # | Finding it answers | Heuristic | Screen or system | Commit(s) | How I know it worked |
|---|---|---|---|---|---|
| 1 | SS's Screen 1 finding (sev 3) and my Finding 5 (sev 4), with my Finding 3 closed on the way | 7 Flexibility and Efficiency of Use; 6 Recognition Rather than Recall | Screen 1: screen. Screen 2: system (a place name is now resolved to a postal code, and a no-charger postal code returns the three nearest LTA sites) | `Search chargers around a chosen place on Screen 1 (H7, sev 3, raised by SS)`; `Screen 2 search accepts a place name, not only a postal code (H6/H3/H7, sev 4, raised by me)`; `No-charger location shows the three nearest LTA sites instead of fixed chips (H6/H1, sev 4 and 3, raised by me)`; `Nearest LTA sites shown directly under the no-charger message (H6, sev 4, raised by me)` | Walked SS's finding on the live address: typing Jurong Point moves the five cards to Jurong, Use my GPS restores. Walked my Finding 5: Bedok Mall on Screen 2 shows three real sites with distances, no format error. |
| 2 | JT's Finding 3 (sev 3) | 1 Visibility of System Status | System (the backend stopped after three LTA matches and dropped the rest) plus the label on the screen | `Screen 1 shows the five nearest stations and labels missing live data (H1, sev 3, raised by JT)`; `Fix ReferenceError in stations route from the five-nearest change (H1, sev 3, raised by JT)` | From Changi the nearest station is now 19 Ubi Road 4 at 10.7 km, which the old version hid; the old "Closest to You" (Toa Payoh) is third at 14.9 km. Four cards say "Live slot data not available for this site". |
| 3 | WB's Finding 1 (sev 2) | 1 Visibility of System Status (the agent argued 2 or 8) | Screen | `Remove raw LTA status code from Screen 2 result card (H1/H2, sev 2, raised by WB)` | 038983 on Screen 2 reads "28 available now" with no code. |
| 4 | JT's Finding 1 (sev 2) and my Finding 1 (sev 1) | 7 Flexibility and Efficiency of Use | Screen | `Battery level accepts a typed value and survives reload (H7, sev 1 mine / 2 JT, raised by both)` | Tapping 20% and typing 80 is one step; a reload keeps it; 0 and 150 are refused. |

Decisions that were mine: the header search box (I proposed it, the agent argued it would break heuristic 1 by turning the "GPS Active" status badge into a text box, and I accepted that and turned my own repair down); rejecting the agent's screen-only fix in Repair 2, because its own explanation of the code showed the problem was in the system; and the design of Repair 2 itself, five nearest stations with the ones lacking live data labelled instead of hidden. The agent produced the geocode route, the nearest-sites lookup and the code for all four repairs. The one argument I turned down was its screen-only alternative in Repair 2; before turning it down I checked what its point 1 had admitted, that `api/stations.js` stopped after three LTA matches, which was JT's finding exactly.

What I will look for in comments over the next week: whether anyone says Screen 1 feels slower now that it returns five stations, whether "Live slot data not available for this site" reads as honest or as broken, and whether a place-name search on either screen sends anyone to the wrong place.

---

## Q5. What did my users give me that I could not have found myself?

Vidhya screen 1, finding a destination you're not currently at.
Janelle when she pointed out she could see a nearer EV station near her but my app wasn't showing it because its only designed to show stations which also provide Slot availability data.
Beichao mentioned app doesnt contain data on the type of charger available at stations leaving a first time user lost on weather their car can be charged at a specific station. I havent changed this part yet.

The one I could not have found myself is Vidhya's. On Screen 1 (the main charger list) she wanted chargers near a place she was not standing at, somewhere she was planning to drive to later, and found there was no field for it. I had never done that in any of my own testing because I always opened the app with GPS on, standing where I was, and the app answered the question I was asking. The question a driver asks before setting off was not one I had ever asked of it.

---

## Q6. Did the AI help me confirm, or help me falsify?

Reapir 1 - Agent was right, and helped me do the needful changes, that was basically adding a ENTER DESTINATION search in screen one and not make USER live location as the only place to reach location and look for chargers.
Repair 2- Agent gave a wrong fix on screen1 not showing  nearest station just because it doesnt have live slots data at that nearest locations. I rejected AI reasoning and asked it ti show all locations but simply point out which station has no data on live slots available.

Repairr 3- Beichao mentioned about successful search showing a meaningless tab in screen 2 as "STATUS 1", AI agreed its an issue as well but argued on which heuristic it is.

Reapair 4 - Battery % on top being able to manually input no. Rather than keep pressing +-, not only AI did not argue back, it did not seek permission also before proceeding to change that error or limitation and properly fixed it. "agreed more readily than the evidence justified"

The clearest case of the agent being wrong was not an argument but a report. After Repair 2 it wrote "Guardrails preserved: Disqus, privacy notices, and /api/health remain functional and intact." /api/health did pass, but Screen 1 showed "Upstream Open Charge Map is unreachable" on every load, because the new code used two variable names it had never declared. The agent's report, the health check and the data source all said fine; only walking the live address said otherwise. I never asked the agent whether the product was better now, so I have no answer from it to report; the answer came from my groupmates' findings walked again on the live address.
