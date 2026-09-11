import type { WeekQuestions } from "../types";

/** Q2 — Engagement, Outbound Communication & Conversion (weeks 14-26) */
export const recruiterQ2: WeekQuestions = {
  14: [
    {
      scenario: "Which opening line is most likely to earn a reply from a passive candidate?",
      options: [
        "\"I came across your profile and think you'd be a great fit for an exciting opportunity.\"",
        "\"Your talk on migrating a monolith to services is exactly the problem our platform team is stuck on right now.\"",
        "\"Are you open to new opportunities?\"",
      ],
      correctIndex: 1,
      explanation:
        "A specific, verifiable reason for contacting this person shows the message was written for them and gives them a reason to keep reading.",
    },
    {
      scenario: "What is the most common reason strong outreach still fails?",
      options: [
        "It is too short",
        "It is about what the company wants rather than what the candidate would gain or solve",
        "It was sent in the morning",
      ],
      correctIndex: 1,
      explanation:
        "Outreach converts when the value flows towards the reader. Company-centric messages read as broadcast, not invitation.",
    },
    {
      scenario: "How long should a first outreach message be?",
      options: [
        "Short enough to read on a phone in under 30 seconds while still naming the hook, the role and one clear ask",
        "As detailed as possible so the candidate can self-select",
        "One line with just the job title",
      ],
      correctIndex: 0,
      explanation:
        "Brevity with substance wins. Detail belongs in the follow-up conversation, not the first touch.",
    },
  ],
  15: [
    {
      scenario: "Which candidate value proposition is strongest for a senior hire?",
      options: [
        "\"We have a great culture and free lunches.\"",
        "\"You would own the payments platform end to end, with a rebuild decision to make in your first quarter.\"",
        "\"We are a fast-growing market leader.\"",
      ],
      correctIndex: 1,
      explanation:
        "Senior people buy scope, ownership and interesting problems. Perks and adjectives are undifferentiated.",
    },
    {
      scenario: "The role has a real drawback: legacy code and technical debt. How do you pitch it?",
      options: [
        "Leave it out until the offer stage",
        "Name it honestly and frame the mandate to fix it as the opportunity",
        "Deny it if asked",
      ],
      correctIndex: 1,
      explanation:
        "Honest framing filters for people who want that challenge and prevents the withdrawal that follows a late surprise.",
    },
    {
      scenario: "Where should the value proposition come from?",
      options: [
        "The recruiter's own words",
        "The intake conversation and the hiring manager's description of the real problems to solve",
        "The company careers page",
      ],
      correctIndex: 1,
      explanation:
        "The manager owns the problems, the scope and the first-year mandate — that is what makes the pitch credible.",
    },
  ],
  16: [
    {
      scenario: "You want to improve open rates. What is the disciplined way to test?",
      options: [
        "Change subject line, message body and send time all at once",
        "Change one variable at a time across a reasonable sample and compare",
        "Copy whatever a competitor is doing",
      ],
      correctIndex: 1,
      explanation:
        "Changing one variable at a time is the only way to learn which change actually moved the number.",
    },
    {
      scenario: "Open rate is high but reply rate is low. What does that suggest?",
      options: [
        "The subject line works but the message body or the offer is not compelling",
        "The subject line is broken",
        "You are contacting too few people",
      ],
      correctIndex: 0,
      explanation:
        "Opens measure curiosity, replies measure relevance. The gap points squarely at the body of the message.",
    },
    {
      scenario: "Which channel choice is most defensible?",
      options: [
        "Always email, because it is easiest to automate",
        "The channel where that community actually engages, tested per role and market",
        "Whichever channel the ATS supports",
      ],
      correctIndex: 1,
      explanation:
        "Channel performance varies enormously by discipline and seniority; testing beats habit.",
    },
  ],
  17: [
    {
      scenario: "A candidate has not replied to your first message. What is the best follow-up?",
      options: [
        "Resend the same message the next day",
        "Wait a few days and add something new: a detail about the team, the problem or the process",
        "Send four follow-ups in one week to stay top of mind",
      ],
      correctIndex: 1,
      explanation:
        "Follow-ups that add information respect the reader; identical or rapid-fire repeats read as spam.",
    },
    {
      scenario: "How many touches should a typical outbound sequence contain?",
      options: [
        "One — if they were interested they would reply",
        "Three to four spread over two to three weeks, then a polite close",
        "As many as it takes until they answer",
      ],
      correctIndex: 1,
      explanation:
        "Most positive replies arrive on the second or third touch, but persistence without an end point damages the brand.",
    },
    {
      scenario: "What should the final message in a sequence do?",
      options: [
        "Apply time pressure with a deadline",
        "Close the loop gracefully and leave the door open for later",
        "Copy their manager",
      ],
      correctIndex: 1,
      explanation:
        "A graceful close keeps that person available for the next role; pressure closes the relationship permanently.",
    },
  ],
  18: [
    {
      scenario:
        "A candidate says their current package is already above your maximum. What is the best response?",
      options: [
        "End the process there",
        "Be transparent about the ceiling, explore total package and motivation, and let them decide with full information",
        "Suggest the number is flexible when it is not",
      ],
      correctIndex: 1,
      explanation:
        "Transparency plus exploration either finds a real path or ends the conversation early and respectfully.",
    },
    {
      scenario: "When a candidate refuses to share expectations, what should you do?",
      options: [
        "Insist before continuing",
        "Share your range first and ask whether it is workable",
        "Guess based on their current employer",
      ],
      correctIndex: 1,
      explanation:
        "Leading with your range is fair, legal in more markets, and gets to the same answer without pressure.",
    },
    {
      scenario: "What is the most common cause of a compensation collapse at offer stage?",
      options: [
        "The candidate changed their mind at the last minute",
        "Expectations were never explicitly aligned early in the process",
        "The offer letter template was unclear",
      ],
      correctIndex: 1,
      explanation:
        "Almost every late pay collapse traces back to a conversation that was avoided in week one.",
    },
  ],
  19: [
    {
      scenario:
        "A strong candidate wants full remote; the policy is three days in the office. What do you do?",
      options: [
        "State the policy clearly and early, and explore whether any flexibility genuinely exists",
        "Say it is flexible and hope they settle in",
        "Avoid the topic until after final interview",
      ],
      correctIndex: 0,
      explanation:
        "Clarity loses fewer candidates than ambiguity, and it never produces a resignation three months in.",
    },
    {
      scenario: "How should you present a hybrid policy that is genuinely unpopular?",
      options: [
        "Explain the reasoning behind it and what the office days are actually used for",
        "Blame senior leadership",
        "Describe it as temporary when it is not",
      ],
      correctIndex: 0,
      explanation:
        "Reasoning makes a policy debatable rather than arbitrary, and honesty protects trust for the whole process.",
    },
    {
      scenario: "A candidate asks whether the policy might change. What is the right answer?",
      options: [
        "\"Almost certainly, yes.\"",
        "Tell them what is decided today and be clear that you cannot promise future changes",
        "\"Nothing will ever change.\"",
      ],
      correctIndex: 1,
      explanation:
        "Only commit to what is decided. Speculation becomes a broken promise the moment it is repeated internally.",
    },
  ],
  20: [
    {
      scenario:
        "A candidate is moving from agency to in-house for the first time. What should you assess most carefully?",
      options: [
        "Whether they understand the difference in pace, stakeholders and success measures",
        "Whether they have the exact same job title",
        "How long they stayed at each agency",
      ],
      correctIndex: 0,
      explanation:
        "Pivot risk lives in context, not in capability. Testing their understanding of the new environment predicts the transition.",
    },
    {
      scenario: "Which evidence best supports a career pivot?",
      options: [
        "Enthusiasm for the new field",
        "Concrete transferable work already done in the direction of the pivot",
        "A relevant online course certificate",
      ],
      correctIndex: 1,
      explanation:
        "Work already done in the new direction is the only evidence that separates a real pivot from an aspiration.",
    },
    {
      scenario:
        "The hiring manager is sceptical about a pivot candidate. What is the most useful thing you can bring?",
      options: [
        "A strong personal recommendation",
        "A structured comparison of the candidate's evidence against each agreed criterion",
        "The candidate's salary expectations",
      ],
      correctIndex: 1,
      explanation:
        "Scepticism dissolves against evidence mapped to the agreed bar, not against advocacy.",
    },
  ],
  21: [
    {
      scenario: "When should you bring the hiring manager into a candidate objection?",
      options: [
        "Never — recruiters should resolve objections alone",
        "When the objection is about the work itself, the team or the mandate",
        "Only after the candidate has declined",
      ],
      correctIndex: 1,
      explanation:
        "Questions about the actual job are best answered by the person who owns it; a short manager call often resolves them entirely.",
    },
    {
      scenario: "How should you prepare the manager for that conversation?",
      options: [
        "Send a calendar invite with no context",
        "Brief them on the exact concern, what the candidate values and what would resolve it",
        "Let them improvise so it feels natural",
      ],
      correctIndex: 1,
      explanation:
        "A briefed manager addresses the real concern in ten minutes; an unbriefed one often reinforces it.",
    },
    {
      scenario:
        "The candidate's concern is about a genuine weakness in the team. What should the manager do?",
      options: [
        "Deny it",
        "Acknowledge it honestly and explain the plan and the candidate's part in it",
        "Change the subject to compensation",
      ],
      correctIndex: 1,
      explanation:
        "Honest acknowledgement plus a plan is persuasive; denial is discovered in week two and costs the hire.",
    },
  ],
  22: [
    {
      scenario: "What do candidates most often complain about in hiring processes?",
      options: [
        "Being rejected",
        "Silence and unpredictable timelines",
        "Interviews being too rigorous",
      ],
      correctIndex: 1,
      explanation:
        "People accept a no far more easily than they accept being left in the dark.",
    },
    {
      scenario: "Which change most improves candidate experience for the least effort?",
      options: [
        "Redesigning the careers site",
        "Telling every candidate what happens next and by when, at every stage",
        "Adding an extra interview to be thorough",
      ],
      correctIndex: 1,
      explanation:
        "Predictability is cheap to give and is what candidates actually remember.",
    },
    {
      scenario: "Who owns candidate experience in a hiring process?",
      options: [
        "The recruiter alone",
        "Everyone who touches the process, with the recruiter setting and enforcing the standard",
        "The employer brand team",
      ],
      correctIndex: 1,
      explanation:
        "Experience is created by interviewers, schedulers and managers together; the recruiter holds the standard.",
    },
  ],
  23: [
    {
      scenario:
        "A decision is delayed and you have nothing new to tell the candidate. What do you do?",
      options: [
        "Wait until there is real news",
        "Contact them on the promised day, say the decision has slipped and give a new date",
        "Send a generic \"still in process\" automated email",
      ],
      correctIndex: 1,
      explanation:
        "A held promise with honest news preserves trust; silence is what candidates read as rejection.",
    },
    {
      scenario: "What is the best defence against candidates ghosting you?",
      options: [
        "Requiring a commitment before each stage",
        "Being reliably responsive yourself and keeping the process short",
        "Contacting them daily",
      ],
      correctIndex: 1,
      explanation:
        "Ghosting is usually reciprocal or a symptom of disengagement; responsiveness and pace are the real fix.",
    },
    {
      scenario: "How often should an active candidate hear from you?",
      options: [
        "At every stage transition and at least once a week while a decision is pending",
        "Only when there is a decision",
        "Whenever you happen to have time",
      ],
      correctIndex: 0,
      explanation:
        "A predictable rhythm keeps candidates engaged and keeps you in control of the relationship.",
    },
  ],
  24: [
    {
      scenario: "Which rejection message is most valuable to the candidate?",
      options: [
        "\"We've decided to go in a different direction.\"",
        "A brief note naming the specific capability gap against the role's criteria",
        "No response at all",
      ],
      correctIndex: 1,
      explanation:
        "Specific, criteria-based feedback is useful, defensible and is what turns a rejection into a future relationship.",
    },
    {
      scenario: "What should you avoid when giving rejection feedback?",
      options: [
        "Referring to the agreed criteria",
        "Commenting on personality, style or fit without evidence",
        "Keeping the message short",
      ],
      correctIndex: 1,
      explanation:
        "Unevidenced personal comments are both unhelpful and legally risky; stick to what was assessed.",
    },
    {
      scenario: "When is the best time to reject a candidate you know will not progress?",
      options: [
        "As soon as the decision is genuinely made",
        "At the end of the whole process, in case someone drops out",
        "Never, in case they reapply",
      ],
      correctIndex: 0,
      explanation:
        "Prompt rejection respects the candidate's other options and protects your reputation.",
    },
  ],
  25: [
    {
      scenario: "A strong candidate lost out to a marginally better hire. What next?",
      options: [
        "Close the record and move on",
        "Tell them honestly where they stood and agree how and when you will stay in touch",
        "Keep them in the process for the same role indefinitely",
      ],
      correctIndex: 1,
      explanation:
        "Silver medallists are among the highest-converting future hires — but only if the relationship is maintained deliberately.",
    },
    {
      scenario: "What makes a talent pool actually useful?",
      options: [
        "Its size",
        "Recent, relevant contact history and a genuine reason to reconnect",
        "How it is tagged in the ATS",
      ],
      correctIndex: 1,
      explanation:
        "A pool without recent context is just a list. Relationship history is what makes re-engagement work.",
    },
    {
      scenario: "How should you re-engage a silver medallist six months later?",
      options: [
        "With a generic new-role blast",
        "By referencing the previous process and explaining why this role is different",
        "By asking if they are still looking",
      ],
      correctIndex: 1,
      explanation:
        "Continuity is the whole advantage of a silver medallist; a generic blast throws it away.",
    },
  ],
  26: [
    {
      scenario:
        "Reviewing a full engagement cycle, where do most qualified candidates leave the process?",
      options: [
        "At the first outreach, because targeting or message relevance was weak",
        "At the offer, always",
        "During onboarding",
      ],
      correctIndex: 0,
      explanation:
        "The largest single drop is at first contact; fixing targeting and message quality lifts everything downstream.",
    },
    {
      scenario:
        "Your reply rate is strong but candidates drop out after the first interview. What should you examine?",
      options: [
        "The outreach message",
        "Whether the interview experience matches what you promised in the pitch",
        "The number of job boards used",
      ],
      correctIndex: 1,
      explanation:
        "Drop-off after first contact with the team usually means the pitch and the reality diverged.",
    },
    {
      scenario: "What best summarises high-converting recruiting engagement?",
      options: [
        "Volume of touches",
        "Relevance, honesty and reliability sustained across the whole journey",
        "Speed of the offer",
      ],
      correctIndex: 1,
      explanation:
        "Conversion is cumulative — it is built by every interaction being relevant, honest and on time.",
    },
  ],
};
