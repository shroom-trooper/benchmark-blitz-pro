import type { WeekQuestions } from "./types";

export const q1Questions: WeekQuestions = {
  1: [
    {
      scenario:
        "You have 45 minutes with a candidate for a Senior Analyst role. Your co-interviewer suggests you \"just have a chat and see if they feel right\". What do you do?",
      options: [
        "Agree — a relaxed conversation reveals the real person",
        "Use the agreed rubric and ask every candidate the same core competency questions",
        "Do a chat first and score afterwards from memory",
      ],
      correctIndex: 1,
      explanation:
        "Consistency is what makes an interview predictive. Asking every candidate the same competency questions gives you comparable evidence instead of impressions.",
    },
    {
      scenario:
        "Two interviewers score the same candidate 3 and 5 out of 5 on \"analytical thinking\". What is the most likely root cause?",
      options: [
        "One interviewer is simply a tougher grader",
        "The candidate performed differently in each session",
        "The rubric has no behavioural anchors describing what a 3 or a 5 looks like",
      ],
      correctIndex: 2,
      explanation:
        "Wide score spread almost always signals an undefined scale. Behavioural anchors turn a subjective number into a shared standard.",
    },
    {
      scenario:
        "A candidate gives a strong answer that does not map to any competency in your rubric. How should you score it?",
      options: [
        "Record it as a separate observation and score only the defined competencies",
        "Add bonus points to the closest competency",
        "Raise the overall recommendation one level",
      ],
      correctIndex: 0,
      explanation:
        "Off-rubric strengths are worth noting for the debrief, but folding them into a score silently changes the bar for that one candidate.",
    },
  ],
  2: [
    {
      scenario:
        "You want to assess how a candidate handles conflict. Which question yields the most predictive data?",
      options: [
        "\"How would you handle a disagreement with a peer?\"",
        "\"Tell me about a specific disagreement with a peer and what you did.\"",
        "\"Are you good at resolving conflict?\"",
      ],
      correctIndex: 1,
      explanation:
        "Past behaviour beats hypotheticals. A specific lived example produces evidence you can probe; a hypothetical produces the candidate's theory of themselves.",
    },
    {
      scenario:
        "A candidate answers your behavioural question in the abstract: \"We usually align early and escalate if needed.\" What is your best follow-up?",
      options: [
        "Move on — they clearly know the process",
        "Ask \"Walk me through the last time you had to escalate. What did you say?\"",
        "Ask whether they prefer escalation or direct resolution",
      ],
      correctIndex: 1,
      explanation:
        "\"We\" answers hide the individual's contribution. Anchoring to a specific instance forces concrete, verifiable detail.",
    },
    {
      scenario:
        "Which question is most likely to leak the answer you want?",
      options: [
        "\"Describe a time you had to prioritise under pressure.\"",
        "\"We move fast here — can you handle rapidly shifting priorities?\"",
        "\"How did you decide what to drop when everything was urgent?\"",
      ],
      correctIndex: 1,
      explanation:
        "Leading questions signal the desired answer and destroy the signal. Keep questions neutral so the response carries information.",
    },
  ],
  3: [
    {
      scenario:
        "Reviewing your recording, you spoke for 25 of the 45 minutes. What does that mean for your evaluation?",
      options: [
        "It is fine — you were selling the role",
        "You gathered roughly half the evidence you needed and should extend or re-interview",
        "It shows strong engagement and should be scored positively",
      ],
      correctIndex: 1,
      explanation:
        "Talk time is evidence time. When the interviewer dominates, the score reflects the interviewer's impressions rather than the candidate's demonstrated behaviour.",
    },
    {
      scenario:
        "A candidate pauses for eight seconds after a hard question. What is the strongest move?",
      options: [
        "Let the silence run — thinking time is part of the signal",
        "Rephrase the question immediately to reduce awkwardness",
        "Offer a hint to help them start",
      ],
      correctIndex: 0,
      explanation:
        "Silence is data. Interrupting a pause replaces the candidate's reasoning with yours and removes the chance to observe structured thinking.",
    },
    {
      scenario:
        "Which behaviour best demonstrates active listening in a structured interview?",
      options: [
        "Nodding continuously while planning the next question",
        "Summarising the candidate's answer back before probing deeper",
        "Sharing a similar experience from your own career",
      ],
      correctIndex: 1,
      explanation:
        "Reflecting the answer back confirms accuracy, surfaces detail, and keeps the transcript in the candidate's own words.",
    },
  ],
  4: [
    {
      scenario:
        "Your debrief is tomorrow morning and you took no notes during today's interview. What is the honest assessment?",
      options: [
        "Your recall will be good because the interview was memorable",
        "Roughly half your recall is already gone; write structured notes now",
        "Your gut score is more reliable than notes anyway",
      ],
      correctIndex: 1,
      explanation:
        "Interview recall decays sharply within the hour. Notes written immediately preserve what actually happened rather than what you felt.",
    },
    {
      scenario:
        "Which note is most useful to the panel?",
      options: [
        "\"Great communicator, really impressive.\"",
        "\"Said: 'I rebuilt the forecast model in two weeks after the data source changed.' Owned scope, unclear on validation.\"",
        "\"Strong yes — good vibes and relevant background.\"",
      ],
      correctIndex: 1,
      explanation:
        "Notes should capture quotes and observable behaviour tied to a competency. Adjectives without evidence cannot be calibrated by anyone else.",
    },
    {
      scenario:
        "When should you assign scores to your rubric?",
      options: [
        "During the interview, live, as answers land",
        "Immediately after the interview and before hearing anyone else's view",
        "In the debrief so scores can be discussed together",
      ],
      correctIndex: 1,
      explanation:
        "Scoring right after the session protects recall; scoring before the debrief protects independence from the loudest voice in the room.",
    },
  ],
  5: [
    {
      scenario:
        "A candidate reaches the wrong final answer in a case exercise but reasons through trade-offs cleanly. How do you score problem-solving?",
      options: [
        "Low — the answer was wrong",
        "Score the reasoning process against the rubric and note the final error separately",
        "High — outcomes do not matter at all",
      ],
      correctIndex: 1,
      explanation:
        "Process reveals transferable capability; a single wrong output may reflect a missing fact. Score both, but weight the reasoning you can generalise from.",
    },
    {
      scenario:
        "Mid-exercise you add a constraint: the budget is halved. What are you primarily assessing?",
      options: [
        "Whether the candidate can memorise details",
        "How they re-prioritise and adapt their approach under new information",
        "Whether they get frustrated",
      ],
      correctIndex: 1,
      explanation:
        "Injecting a constraint tests adaptability — the behaviour that predicts performance when reality changes after the hire.",
    },
    {
      scenario:
        "A candidate asks three clarifying questions before starting. How should this be read?",
      options: [
        "As hesitation and lack of confidence",
        "As positive signal: they are scoping the problem before solving it",
        "As neutral — it does not belong in the rubric",
      ],
      correctIndex: 1,
      explanation:
        "Scoping before solving is a core problem-solving behaviour. Penalising it rewards people who guess fast over people who think well.",
    },
  ],
  6: [
    {
      scenario:
        "The hiring brief says you need someone \"excellent and high-calibre\". What is your first step as the hiring manager?",
      options: [
        "Translate it into 4-6 role-specific competencies with observable behaviours",
        "Start interviewing and calibrate as you meet people",
        "Benchmark against the last person who held the role",
      ],
      correctIndex: 0,
      explanation:
        "Generic excellence is unmeasurable and invites bias. Role-specific behavioural markers make the bar explicit before the first interview.",
    },
    {
      scenario:
        "Which competency definition is usable in a rubric?",
      options: [
        "\"Strategic thinker\"",
        "\"Can define a 12-month roadmap and explain which items were deliberately deprioritised and why\"",
        "\"Big-picture mindset\"",
      ],
      correctIndex: 1,
      explanation:
        "A usable competency describes an observable behaviour at a specific level, so two interviewers can agree on whether they saw it.",
    },
    {
      scenario:
        "You are hiring two roles on the same team: one build-from-scratch, one optimise-existing. Should the rubric be identical?",
      options: [
        "Yes — same team, same bar",
        "No — the competency weightings must reflect the actual work of each role",
        "Yes, but with a different pass threshold",
      ],
      correctIndex: 1,
      explanation:
        "Competency maps are role-specific. Ambiguity tolerance matters for zero-to-one work; systematic rigour matters for optimisation.",
    },
  ],
  7: [
    {
      scenario:
        "At the 35-minute mark of a 45-minute interview you still have two competencies to cover. What is the best move?",
      options: [
        "Speed through both with shortened answers",
        "Cover the higher-weighted competency properly and flag the gap for the panel",
        "Run 20 minutes over",
      ],
      correctIndex: 1,
      explanation:
        "Half-assessed competencies produce false confidence. Depth on the priority plus an explicit gap note is more honest than rushed coverage.",
    },
    {
      scenario:
        "How much time should you protect at the end of a session for candidate questions and next steps?",
      options: [
        "Whatever is left over",
        "A planned 5-10 minutes, held even if the assessment is not finished",
        "None — the recruiter handles that",
      ],
      correctIndex: 1,
      explanation:
        "The close is part of the assessment and the experience. Cutting it raises candidate anxiety and loses signal from their questions.",
    },
    {
      scenario:
        "A candidate's first answer runs eleven minutes. What do you do?",
      options: [
        "Let them finish to be polite",
        "Politely interrupt and redirect: \"That's helpful — I want to make sure we cover two more areas.\"",
        "Cut the remaining questions",
      ],
      correctIndex: 1,
      explanation:
        "Redirecting with a stated reason is respectful and preserves coverage. Silence-by-politeness costs the candidate their fair assessment.",
    },
  ],
  8: [
    {
      scenario:
        "You are hiring for a fully distributed team. Which evidence best predicts success?",
      options: [
        "Enthusiasm about remote work in the interview",
        "Concrete examples of written updates, documentation, and async decision-making",
        "Previous experience working from home",
      ],
      correctIndex: 1,
      explanation:
        "Working remotely is not a skill; communicating asynchronously with clarity is. Ask for artefacts and specific practices.",
    },
    {
      scenario:
        "How should you assess a candidate's async communication?",
      options: [
        "Ask them to describe their ideal working setup",
        "Ask for a specific time they unblocked a teammate in a different timezone and what they wrote",
        "Check whether they respond quickly to your emails",
      ],
      correctIndex: 1,
      explanation:
        "A concrete unblocking story exposes the actual behaviour: proactive context-sharing, written clarity, and follow-through.",
    },
    {
      scenario:
        "A candidate says they \"prefer to jump on a call for anything unclear\". How do you read this for a distributed role?",
      options: [
        "Positive — they are collaborative",
        "Worth probing: it may signal a default that does not scale across timezones",
        "Disqualifying",
      ],
      correctIndex: 1,
      explanation:
        "It is a signal to probe, not a verdict. Ask how they handle a blocker when nobody is online for eight hours.",
    },
  ],
  9: [
    {
      scenario:
        "Candidate A has five years with your exact toolchain. Candidate B has deeper fundamentals and no exposure to your stack. The role is a three-year investment. What matters most?",
      options: [
        "Tool familiarity — they will be productive on day one",
        "Learning velocity and fundamentals, with an onboarding plan for the tooling",
        "Neither — hire on culture",
      ],
      correctIndex: 1,
      explanation:
        "Tool knowledge decays fast; learning velocity compounds. Weight the durable capability unless the role is a short-term specialist need.",
    },
    {
      scenario:
        "How do you evidence learning velocity in an interview?",
      options: [
        "Ask what they are currently learning and why",
        "Ask for a specific example of ramping into an unfamiliar domain, including how they knew they were up to speed",
        "Look for a wide list of technologies on the CV",
      ],
      correctIndex: 1,
      explanation:
        "A worked ramp-up story with a self-assessment checkpoint shows the method, not just the appetite.",
    },
    {
      scenario:
        "When is domain-specific knowledge genuinely the right thing to weight highest?",
      options: [
        "Always — it reduces risk",
        "When the role is short-term, highly regulated, or requires immediate specialist judgement",
        "Never",
      ],
      correctIndex: 1,
      explanation:
        "Context decides. Compliance, safety-critical or short-tenure roles legitimately weight domain depth over adaptability.",
    },
  ],
  10: [
    {
      scenario:
        "You open the interview by describing the role exactly as the job ad does. What is the risk?",
      options: [
        "None — consistency is good",
        "The candidate cannot self-assess against the real challenges, so both sides evaluate on incomplete information",
        "The candidate will lose interest",
      ],
      correctIndex: 1,
      explanation:
        "Candidates need the team's current problems to judge fit. A generic pitch produces generic answers and late-stage surprises.",
    },
    {
      scenario:
        "Which framing gives the most useful context?",
      options: [
        "\"We're a fast-paced, high-growth team.\"",
        "\"Right now our reporting is manual and takes three days a month — this role automates that in year one.\"",
        "\"You'd own analytics for the business.\"",
      ],
      correctIndex: 1,
      explanation:
        "Specific, current challenges let a candidate demonstrate relevant thinking and self-select honestly.",
    },
    {
      scenario:
        "A candidate asks what success looks like in six months. You do not have a crisp answer. Best response?",
      options: [
        "Improvise something plausible",
        "Say you will confirm precisely, give the honest current thinking, and follow up in writing",
        "Redirect to the job description",
      ],
      correctIndex: 1,
      explanation:
        "Honesty plus a written follow-up builds trust and forces the hiring team to define success — a benefit to the eventual hire.",
    },
  ],
  11: [
    {
      scenario:
        "A panel member votes no because the candidate \"wouldn't fit our culture — they're quite reserved\". How do you respond?",
      options: [
        "Accept it; culture matters",
        "Ask which specific team value or behaviour the evidence contradicts",
        "Overrule the vote",
      ],
      correctIndex: 1,
      explanation:
        "\"Fit\" must be converted into a stated value with evidence. Personality style is not a value, and unchallenged fit language enforces sameness.",
    },
    {
      scenario:
        "What is the difference between culture fit and culture add?",
      options: [
        "Nothing — they are two words for the same idea",
        "Fit asks whether they resemble the current team; add asks what capability or perspective they bring that is missing",
        "Add is about hiring for diversity quotas",
      ],
      correctIndex: 1,
      explanation:
        "Culture add is assessed against stated values plus a gap analysis, which strengthens the team instead of duplicating it.",
    },
    {
      scenario:
        "Which is a legitimate, evidence-based values assessment?",
      options: [
        "\"Would I want to have a beer with them?\"",
        "\"Give me an example of raising a concern about quality when it was inconvenient\" — for a team value of candour",
        "\"Do they share our sense of humour?\"",
      ],
      correctIndex: 1,
      explanation:
        "Tie each value to a behavioural question. Social comfort tests measure similarity, not values.",
    },
  ],
  12: [
    {
      scenario:
        "Your debrief begins with the most senior person saying \"I loved them\". What has already gone wrong?",
      options: [
        "Nothing — leadership should set direction",
        "The anchor is set; remaining scores will drift toward the dominant voice",
        "The debrief should have been shorter",
      ],
      correctIndex: 1,
      explanation:
        "Groupthink starts with the first opinion. Independent scores must be submitted before anyone speaks.",
    },
    {
      scenario:
        "How should a well-run debrief be sequenced?",
      options: [
        "Submit independent scores, share them all at once, then discuss the largest divergences with evidence",
        "Discuss impressions, then score together to reach consensus",
        "Have the hiring manager decide and ask for objections",
      ],
      correctIndex: 0,
      explanation:
        "Independent scoring first, divergence-led discussion second. Consensus reached before evidence is just conformity.",
    },
    {
      scenario:
        "Two interviewers disagree sharply on the same competency. What is the most productive next step?",
      options: [
        "Average the scores",
        "Have each cite the specific behaviour they observed and check whether they probed different things",
        "Defer to whoever is more senior",
      ],
      correctIndex: 1,
      explanation:
        "Divergence is information. Comparing evidence usually reveals a coverage gap rather than a genuinely ambiguous candidate.",
    },
  ],
  13: [
    {
      scenario:
        "Quarter recap: which combination most improves hiring accuracy?",
      options: [
        "Longer interviews and more panel members",
        "Structured rubric, behavioural questions, immediate notes, and independent scoring before debrief",
        "More candidates in the pipeline",
      ],
      correctIndex: 1,
      explanation:
        "Structure at every stage — question design, evidence capture, and independent scoring — is what lifts prediction from 14% to over 50%.",
    },
    {
      scenario:
        "You have practised these habits for a quarter. What keeps them from decaying?",
      options: [
        "One annual training session",
        "Short, spaced repetition and reviewing your own scoring data regularly",
        "Interviewing more often",
      ],
      correctIndex: 1,
      explanation:
        "Spaced repetition dramatically outperforms one-off training for long-term behavioural retention.",
    },
    {
      scenario:
        "A colleague says structure \"makes interviews robotic and hurts candidate experience\". Best evidence-based reply?",
      options: [
        "Agree and loosen the process for senior roles",
        "Structure governs what you assess, not your warmth — candidates rate structured, well-explained interviews more fairly",
        "Structure only matters for junior roles",
      ],
      correctIndex: 1,
      explanation:
        "Structure and warmth are independent. Candidates consistently perceive consistent, transparent processes as fairer.",
    },
  ],
};
