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

## Q2. Which prediction broke, and what did it teach me?

## Q3. Which groupmate finding did I nearly dismiss, and what did the evidence say?

## Q4. What did I revise, which heuristic does it serve, and how do I know it worked?

## Q5. What did my users give me that I could not have found myself?

## Q6. Did the AI help me confirm, or help me falsify?
