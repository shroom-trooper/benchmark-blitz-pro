import type { WeekQuestions } from "../types";

/** Q4 — Negotiation, Closing & Hiring Manager Partnership (weeks 40-52) */
export const recruiterQ4: WeekQuestions = {
  40: [
    {
      scenario: "What does pre-closing a candidate actually mean?",
      options: [
        "Getting a verbal yes to specific terms before the formal offer is issued",
        "Sending the offer as quickly as possible",
        "Asking whether they are excited about the role",
      ],
      correctIndex: 0,
      explanation:
        "Pre-closing tests commitment against real numbers and a real start date, so the formal offer confirms a decision already made.",
    },
    {
      scenario: "When should pre-closing conversations begin?",
      options: [
        "After the offer is approved",
        "Progressively through the process, well before the final stage",
        "Only if the candidate raises it",
      ],
      correctIndex: 1,
      explanation:
        "Commitment is built across the process; leaving it to the end gives you no time to address what surfaces.",
    },
    {
      scenario: "Which pre-close question is most revealing?",
      options: [
        "\"Are you interested in the role?\"",
        "\"If we offered X on Y date, what would you say, and what would you need to work through first?\"",
        "\"Do you like the team?\"",
      ],
      correctIndex: 1,
      explanation:
        "A concrete, conditional question surfaces the real remaining obstacles instead of polite enthusiasm.",
    },
  ],
  41: [
    {
      scenario: "Which signal most suggests counter-offer risk?",
      options: [
        "The candidate speaks warmly about their current manager and has not told anyone they are looking",
        "The candidate asks detailed questions about the team",
        "The candidate negotiates on salary",
      ],
      correctIndex: 0,
      explanation:
        "Strong attachment plus no internal signalling means the resignation conversation has not been faced yet — that is where counter-offers win.",
    },
    {
      scenario: "How do you reduce counter-offer risk before the offer?",
      options: [
        "Ask them to promise not to accept one",
        "Walk through the resignation conversation and what they would do if their employer counters",
        "Increase the offer preemptively",
      ],
      correctIndex: 1,
      explanation:
        "Rehearsing the moment makes it real. A candidate who has thought it through is far less likely to be caught off guard.",
    },
    {
      scenario: "A candidate accepts, then goes quiet before the start date. What do you do?",
      options: [
        "Wait until the start date",
        "Keep a light, regular connection with them and the hiring manager through notice period",
        "Send the contract again",
      ],
      correctIndex: 1,
      explanation:
        "The notice period is when counter-offers and doubts land; a warm, regular connection is the main defence.",
    },
  ],
  42: [
    {
      scenario: "What is expectation anchoring in a hiring process?",
      options: [
        "Setting realistic reference points for pay, level, timeline and scope early and consistently",
        "Refusing to discuss salary",
        "Starting with a low offer to leave negotiating room",
      ],
      correctIndex: 0,
      explanation:
        "Consistent early reference points prevent expectations drifting away from what you can actually deliver.",
    },
    {
      scenario: "A candidate's expectations have crept upwards during the process. Why does that usually happen?",
      options: [
        "They received competing interest and nobody re-confirmed the range along the way",
        "They forgot the original conversation",
        "The interviews took too long",
      ],
      correctIndex: 0,
      explanation:
        "Anchors need reinforcing. Competing offers move expectations quickly unless you keep checking in on the number.",
    },
    {
      scenario: "How should you reinforce an anchor without pressuring?",
      options: [
        "Re-confirm the range and timeline briefly at each stage transition",
        "Repeat the number in every message",
        "Ask them to sign a commitment letter",
      ],
      correctIndex: 0,
      explanation:
        "A brief, routine re-confirmation keeps everyone honest and surfaces drift while there is still time to act.",
    },
  ],
  43: [
    {
      scenario: "Which motivation is most durable in a candidate's decision?",
      options: [
        "A specific problem they want to solve and scope they cannot get today",
        "A round-number salary target",
        "Curiosity about the company",
      ],
      correctIndex: 0,
      explanation:
        "Money moves people to the table; scope and problems keep them there through a competing offer.",
    },
    {
      scenario: "How do you uncover real motivation?",
      options: [
        "Ask \"what motivates you?\"",
        "Ask what would have to be true for them to still be in their current job in two years",
        "Ask about their five-year plan",
      ],
      correctIndex: 1,
      explanation:
        "Framing it around staying reveals the actual gap they are trying to close, which is what you need to speak to.",
    },
    {
      scenario:
        "A candidate's stated motivation is growth, but every question is about compensation. What does that tell you?",
      options: [
        "They are lying and should be dropped",
        "The stated and actual drivers differ — plan the close around the real one while testing the fit honestly",
        "Nothing useful",
      ],
      correctIndex: 1,
      explanation:
        "The mismatch is information. Closing on the stated motivation while the real driver is unmet is how offers fail.",
    },
  ],
  44: [
    {
      scenario: "What is the strongest preparation before a salary negotiation?",
      options: [
        "Knowing your true ceiling, the non-cash levers available and the candidate's priorities",
        "Deciding to hold firm no matter what",
        "Asking the candidate to name a number first",
      ],
      correctIndex: 0,
      explanation:
        "Negotiations are won in preparation: knowing your limits and their priorities lets you trade rather than argue.",
    },
    {
      scenario: "A candidate asks for 10% above your ceiling. What is the best response?",
      options: [
        "Reject the request immediately",
        "Be clear about the cash ceiling and explore levers such as start date, review timing, sign-on or scope",
        "Take it to the manager without any analysis",
      ],
      correctIndex: 1,
      explanation:
        "Naming the constraint honestly while opening other levers is what closes gaps that pure cash cannot.",
    },
    {
      scenario: "What should you never do in a negotiation?",
      options: [
        "Say you need to check with the hiring manager",
        "Commit to something you have not had approved",
        "Ask what matters most to them",
      ],
      correctIndex: 1,
      explanation:
        "An unapproved promise is a broken promise, and it costs both the hire and your credibility internally.",
    },
  ],
  45: [
    {
      scenario: "A candidate says equity is \"monopoly money\". How should you respond?",
      options: [
        "Agree and focus only on cash",
        "Explain the mechanics honestly: type of grant, vesting, current valuation, dilution and realistic scenarios",
        "Quote the most optimistic exit valuation",
      ],
      correctIndex: 1,
      explanation:
        "Candidates discount what they do not understand. Honest mechanics, including the downside, build trust and value.",
    },
    {
      scenario: "Which equity information is most useful to a candidate?",
      options: [
        "The total number of shares granted",
        "The percentage of the company, the vesting terms and what has to be true for it to be worth something",
        "The company's last funding round only",
      ],
      correctIndex: 1,
      explanation:
        "Share counts mean nothing without ownership percentage, vesting and a realistic path to value.",
    },
    {
      scenario: "What should you avoid when discussing equity?",
      options: [
        "Explaining the vesting cliff",
        "Projecting a specific future value as if it were expected",
        "Referring them to the plan documents",
      ],
      correctIndex: 1,
      explanation:
        "Projected values are speculation and can amount to a misrepresentation the company has to live with.",
    },
  ],
  46: [
    {
      scenario: "Base salary is capped but the candidate needs more overall. Which lever is usually available first?",
      options: [
        "A sign-on payment or an earlier review date",
        "A promise of promotion within six months",
        "Backdating the start date",
      ],
      correctIndex: 0,
      explanation:
        "Sign-on and review timing are concrete, approvable levers. Promotion promises are rarely in your gift to give.",
    },
    {
      scenario: "How should you decide the opening offer number?",
      options: [
        "The bottom of the range, to leave negotiating room",
        "A fair, well-justified number based on the evidence, internal equity and the candidate's expectations",
        "The top of the range every time",
      ],
      correctIndex: 1,
      explanation:
        "Lowball openings cost goodwill and time; a well-reasoned number closes faster and holds up internally.",
    },
    {
      scenario: "What is the risk of stretching well beyond internal benchmarks to win a candidate?",
      options: [
        "There is no real risk",
        "Internal equity problems and a compensation precedent you will have to defend",
        "The candidate will decline",
      ],
      correctIndex: 1,
      explanation:
        "Every out-of-band offer becomes next quarter's expectation and a retention problem for existing staff.",
    },
  ],
  47: [
    {
      scenario: "Your candidate has a competing offer expiring on Friday. What is the best move?",
      options: [
        "Ask them to stall",
        "Compress your remaining process and be transparent about exactly what you can deliver and when",
        "Match the other offer immediately without analysis",
      ],
      correctIndex: 1,
      explanation:
        "Speed and honesty are the two things you control; blind matching often overpays and still loses.",
    },
    {
      scenario: "Should you use an exploding offer deadline to compete?",
      options: [
        "Yes, it forces a decision",
        "No — give a reasonable deadline and use the time to strengthen the case",
        "Only for junior roles",
      ],
      correctIndex: 1,
      explanation:
        "Pressure tactics damage the brand and often produce a reluctant acceptance that unravels during notice.",
    },
    {
      scenario: "A candidate chooses the other offer. What is the most valuable thing you can do?",
      options: [
        "Ask what drove the decision and keep the relationship warm",
        "Withdraw politely and close the record",
        "Improve the offer one more time",
      ],
      correctIndex: 0,
      explanation:
        "The reason is competitive intelligence for the next search, and the relationship often converts later.",
    },
  ],
  48: [
    {
      scenario: "What should a weekly hiring manager calibration cover?",
      options: [
        "Pipeline against the plan, feedback on real candidates and any change to the bar",
        "A general catch-up",
        "Only the number of CVs sent",
      ],
      correctIndex: 0,
      explanation:
        "Calibration is about decisions and evidence, not activity reporting — that is what keeps the search aligned.",
    },
    {
      scenario: "A manager's feedback contradicts what was agreed at intake. What do you do?",
      options: [
        "Follow the new preference silently",
        "Surface the change explicitly and update the agreed criteria and the search plan together",
        "Insist on the original agreement",
      ],
      correctIndex: 1,
      explanation:
        "Bars legitimately evolve. Making the change explicit keeps the search honest and prevents wasted sourcing.",
    },
    {
      scenario: "Which recruiter behaviour builds the most credibility with hiring managers?",
      options: [
        "Agreeing with everything they say",
        "Bringing market evidence and clear options to every decision",
        "Sending the highest possible volume of profiles",
      ],
      correctIndex: 1,
      explanation:
        "Managers trust recruiters who bring data and choices; volume and agreement both read as order-taking.",
    },
  ],
  49: [
    {
      scenario: "What is the most common cause of losing candidates late in a process?",
      options: [
        "Slow feedback and scheduling delays",
        "Interviews being too difficult",
        "Salary bands being published",
      ],
      correctIndex: 0,
      explanation:
        "Delay is the single biggest avoidable cause of candidate loss, and it is entirely within the process's control.",
    },
    {
      scenario: "How should feedback SLAs be agreed?",
      options: [
        "Set at intake as a specific commitment, with a named fallback if the manager is unavailable",
        "Assumed to be as fast as possible",
        "Set by the recruiting team without manager input",
      ],
      correctIndex: 0,
      explanation:
        "An explicit, mutually agreed commitment with a fallback is what makes an SLA hold under pressure.",
    },
    {
      scenario: "A manager repeatedly misses the 48-hour feedback commitment. What is the best escalation?",
      options: [
        "Show the measured impact: candidates lost, time added, and offer the fallback reviewer",
        "Stop sending candidates",
        "Escalate to their director immediately",
      ],
      correctIndex: 0,
      explanation:
        "Impact data plus a practical alternative changes behaviour without turning the partnership adversarial.",
    },
  ],
  50: [
    {
      scenario: "A search has stalled because the manager has stopped engaging. What restarts it fastest?",
      options: [
        "A short, data-led review: pipeline status, cost of delay and the two decisions needed",
        "Weekly chasing emails",
        "Pausing the search",
      ],
      correctIndex: 0,
      explanation:
        "Managers respond to specific decisions and consequences, not to reminders that something is outstanding.",
    },
    {
      scenario: "Which framing is most likely to re-engage a dormant hiring manager?",
      options: [
        "\"We haven't heard from you.\"",
        "\"Two of the three shortlisted candidates are in final stages elsewhere — we need a decision this week.\"",
        "\"Can we book a catch-up sometime?\"",
      ],
      correctIndex: 1,
      explanation:
        "Concrete, time-bound consequences create urgency that generic check-ins never will.",
    },
    {
      scenario: "The manager's real blocker is that priorities have changed. What should you do?",
      options: [
        "Keep sourcing at the same intensity",
        "Agree openly to pause or rescope, and protect the candidates in process with honest communication",
        "Escalate to force the search forward",
      ],
      correctIndex: 1,
      explanation:
        "When the need has genuinely changed, the professional move is to rescope and treat candidates honestly.",
    },
  ],
  51: [
    {
      scenario: "Your funnel shows strong applications but very few pass the screen. Where is the problem?",
      options: [
        "The interview loop",
        "Targeting or the advert is attracting the wrong people, or the screen bar is misaligned",
        "The offer package",
      ],
      correctIndex: 1,
      explanation:
        "A high application-to-screen drop points upstream at attraction and alignment, not at later stages.",
    },
    {
      scenario: "Which metric best reveals hiring manager partnership health?",
      options: [
        "Number of CVs submitted",
        "Shortlist acceptance rate and time to feedback",
        "Total time to hire",
      ],
      correctIndex: 1,
      explanation:
        "Shortlist acceptance and feedback speed measure alignment and responsiveness — the two things the partnership controls.",
    },
    {
      scenario: "How should funnel data be used in a manager conversation?",
      options: [
        "To assign blame for the delay",
        "To locate the specific bottleneck and agree one change to test",
        "To justify hiring an agency",
      ],
      correctIndex: 1,
      explanation:
        "Data is most persuasive when it produces one concrete, testable change rather than a verdict.",
    },
  ],
  52: [
    {
      scenario: "What best describes a recruiter operating as a strategic talent partner?",
      options: [
        "Filling every requisition exactly as written, as fast as possible",
        "Shaping hiring decisions with market evidence, structured assessment and honest trade-offs",
        "Running the highest outreach volume in the team",
      ],
      correctIndex: 1,
      explanation:
        "Partnership is defined by influence on the decision quality, not by throughput on the requisition.",
    },
    {
      scenario: "Which outcome most demonstrates recruiting capability over a year?",
      options: [
        "Hires who perform and stay, with a process candidates speak well of",
        "The highest number of interviews scheduled",
        "The largest talent pool in the ATS",
      ],
      correctIndex: 0,
      explanation:
        "Performance and retention, plus candidate reputation, are the outcomes the business actually needs.",
    },
    {
      scenario: "You disagree with a hiring decision the manager is about to make. What is the professional move?",
      options: [
        "Say nothing — it is their decision",
        "State your evidence and concern clearly once, then support the decision and record it",
        "Escalate above them",
      ],
      correctIndex: 1,
      explanation:
        "Advisors state the evidence plainly, then respect ownership. Recording it keeps the learning available later.",
    },
  ],
};
