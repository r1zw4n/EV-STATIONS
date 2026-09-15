
# REFLECTIONS

## Front-end criteria

You are not starting from nothing. You already know the user and the job from Problem Set 1, so the criteria should follow from those instead of from a list of design virtues. The questions worth turning into criteria are these:

**1) can a stranger tell within a few seconds what this is for;**

Answer : fully MET  "a first time visitor can see at glance clearly defined screen". I sent this link to classmate and they can tell what this is.

**2) is the one job reachable without instruction;**

Answer : MET Partially, The app is default set to 20%. Theres no way for user to change and update their own live % of charge

(The job is: see a station, see its speed, see how long the charge takes from 20%.)

**3) does the screen say something sensible on a phone as well as on a laptop;**

Answer : Partially MET, the screen shows nearest location and available slots in each parking.

**4) is every claim on the screen one the product can actually support;**

Answer : NOT MET : screen two showing how many empty slots at each parking location is not verifiable by API data shown.

**5) and does the thing a user is most likely to get wrong have a way back.**

Answer : NOT MET: the default location is set to CITY HALL, the app doesn't pull live location from their phone based on classmates feedback who I have sent link to.

## Back-end criteria

The back end is newer to you, so here is the shape of it. A back end is not judged on whether it works when everything is fine, because that is the easy case and any tutorial gets there. It is judged on what it does when something is wrong, and on whether somebody who did not write it can find out what happened. The questions worth turning into criteria:

**1) does the product behave sensibly when the source is empty rather than merely when it is full;**

Answer: MET, product front end works well even when source is empty

**2) can a person who is not you tell whether the service is up;**

Answer: partially MET, they can tell its active for first screen but not for second one unable to verify empty slots

**3) is the credential genuinely unreachable from the page and absent from the repository;**

Answer: MET

**4) does the product ask the source no more often than the source actually changes;**

Answer: NOT Sure

**5) and does a failure produce a sentence a user can act on instead of a blank space.**

Answer : Fully MET: yes the failure is data is unreachable not saying any error and after loading/feeding API backend via vercel it works

---

## Q1

**Where did the agent make you faster, and by how much?**

The agent helped me advice on the second prompt for the backend after I had done the original idea and main first prompt to create the front end. It also made my work faster in helping a website which can give me real live data and give my app it's API code, which was outside of the LTA mall api.

## Q2

**Where did it cost you time, and whose fault was that?**

Getting my own API and building a new front end from scratch.

## Q3

**Did it ever hand you something that looked right and was not?**

The back end was not right for page two showing live data for empty slots on each near parking lot, it only shows nearest location to me and the charging time.

## Q4

**What did you have to know in order to supervise it?**

I had to check the source website does not actually have that data provided.

## Q5

**Which decisions did you keep, and should you have kept more or fewer?**

I kept the 20% charge as default for the user. And screen two lives on invented data.

## Q6

**Now scale it up: what does this mean for a team of thirty?**

Every real decision made here has a consequence for the user, for a team of thrity they may or may not catch the issue and it can cause more cascading failure for the user. But also bigger team means collaborations is stronger and better. Need to think on this more hoesntly.

Thanks
