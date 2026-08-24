import type { WeekQuestions } from "./types";

export const q4Questions: WeekQuestions = {
  40: [
    {
      scenario:
        "You are hiring a first-line manager. Which evidence best predicts success?",
      options: [
        "Their individual performance record",
        "Concrete examples of developing others and handling a difficult performance conversation",
        "Their years of experience in the function",
      ],
      correctIndex: 1,
      explanation:
        "Individual excellence does not transfer to management. Assess coaching, feedback and delegation directly.",
    },
    {
      scenario:
        "A candidate for a manager role describes their team's wins entirely in terms of their own decisions. How do you read it?",
      options: [
        "Strong ownership",
        "A signal to probe: effective managers can articulate what their team did without them",
        "Neutral",
      ],
      correctIndex: 1,
      explanation:
        "Managerial capability shows in the ability to describe others' growth and autonomy, not just personal impact.",
    },
    {
      scenario:
        "Which question best assesses delegation?",
      options: [
        "\"Do you prefer to delegate or do things yourself?\"",
        "\"Tell me about a task you were excellent at that you handed to someone else — how did you decide and what happened?\"",
        "\"How big was your team?\"",
      ],
      correctIndex: 1,
      explanation:
        "A specific hand-off story exposes the trade-off reasoning and the follow-through that define real delegation.",
    },
  ],
  41: [
    {
      scenario:
        "You are hiring a senior leader. What should dominate the assessment?",
      options: [
        "Technical depth in the function",
        "Judgement, organisational impact, and how they build capability at scale",
        "Cultural similarity to the executive team",
      ],
      correctIndex: 1,
      explanation:
        "At senior level, leverage comes from judgement and capability building, not individual craft.",
    },
    {
      scenario:
        "How do you test strategic judgement rather than strategic vocabulary?",
      options: [
        "Ask them to critique a real, current trade-off your organisation faces",
        "Ask for their leadership philosophy",
        "Ask about their biggest achievement",
      ],
      correctIndex: 0,
      explanation:
        "A live trade-off forces reasoning under real constraints, which fluent strategy language cannot fake.",
    },
    {
      scenario:
        "A senior candidate describes a failed initiative candidly, including their own error. How should this affect the score?",
      options: [
        "Negatively — failure is a risk indicator",
        "Positively on self-awareness, provided they can explain the systemic learning",
        "It should be excluded from scoring",
      ],
      correctIndex: 1,
      explanation:
        "Candid, analysed failure is one of the most reliable senior-level signals; polished infallibility is the red flag.",
    },
  ],
  42: [
    {
      scenario:
        "An internal candidate applies for a role on your team. How should you assess them?",
      options: [
        "Against the same rubric as external candidates, using both interview evidence and documented performance",
        "Primarily on their reputation internally",
        "More leniently, since they know the company",
      ],
      correctIndex: 0,
      explanation:
        "Internal candidates deserve the same rigour. Reputation is high-noise data compared with rubric-based evidence.",
    },
    {
      scenario:
        "You reject an internal candidate. What is essential?",
      options: [
        "A same-day, specific conversation with clear development guidance",
        "A standard rejection email",
        "Letting their current manager tell them",
      ],
      correctIndex: 0,
      explanation:
        "Internal rejection handled badly is a top driver of regretted attrition. Direct, specific, developmental feedback protects the relationship.",
    },
    {
      scenario:
        "An internal candidate is strong but not ready. What is the best outcome?",
      options: [
        "Hire them anyway to reward loyalty",
        "Decline with a named gap and a concrete plan to close it within a defined period",
        "Decline with no further discussion",
      ],
      correctIndex: 1,
      explanation:
        "A named gap and a plan turns a rejection into retention; vague 'not yet' answers drive people out.",
    },
  ],
  43: [
    {
      scenario:
        "Your team is hiring six roles this quarter. What is the first thing to define?",
      options: [
        "Interview availability",
        "The capability gaps and how the six roles collectively close them",
        "The sourcing channels",
      ],
      correctIndex: 1,
      explanation:
        "Workforce planning starts from capability gaps, not headcount. Otherwise you hire six versions of what you already have.",
    },
    {
      scenario:
        "A role has been open for four months with no acceptable candidates. What should you challenge first?",
      options: [
        "The recruiter's sourcing effort",
        "The role definition and the must-have criteria",
        "The compensation band only",
      ],
      correctIndex: 1,
      explanation:
        "Persistent no-hires usually reflect an over-specified or incoherent role, not a market failure.",
    },
    {
      scenario:
        "You could hire one senior or two mid-level people for the same cost. What decides?",
      options: [
        "Whichever fills fastest",
        "Whether the gap needs judgement and direction, or throughput and coverage",
        "Always seniority for quality",
      ],
      correctIndex: 1,
      explanation:
        "Match the shape of the hire to the shape of the gap; cost equivalence is not capability equivalence.",
    },
  ],
  44: [
    {
      scenario:
        "Your time-to-hire is excellent but 90-day attrition is climbing. What does this indicate?",
      options: [
        "Onboarding is the only problem",
        "Speed may be coming at the cost of assessment rigour or role honesty",
        "The metric is meaningless",
      ],
      correctIndex: 1,
      explanation:
        "Efficiency metrics must be read against quality outcomes. Fast hires that leave are the most expensive kind.",
    },
    {
      scenario:
        "Which is a genuine quality-of-hire signal?",
      options: [
        "Manager satisfaction at 6 and 12 months plus performance ratings and retention",
        "Number of interviews conducted",
        "Offer acceptance rate alone",
      ],
      correctIndex: 0,
      explanation:
        "Quality of hire is a lagging, multi-source measure. Single-point process metrics are proxies, not outcomes.",
    },
    {
      scenario:
        "A dashboard shows your pass-through rate at final stage is 90%. What is the likely cause?",
      options: [
        "Excellent sourcing",
        "The final stage is not discriminating — the real decision is happening earlier",
        "Interviewers are too lenient overall",
      ],
      correctIndex: 1,
      explanation:
        "A stage that almost never rejects is a ceremony. Either sharpen it or remove it.",
    },
  ],
  45: [
    {
      scenario:
        "An AI screening tool ranks candidates for you. What is your responsibility as the hiring manager?",
      options: [
        "Trust the ranking — it is data-driven",
        "Understand what it optimises for, audit its outcomes, and keep the decision human",
        "Use it only for high-volume roles",
      ],
      correctIndex: 1,
      explanation:
        "Models learn from historical decisions, including biased ones. Accountability for the outcome remains with the human.",
    },
    {
      scenario:
        "A candidate discloses they used AI to help draft their take-home submission. What is the fair position?",
      options: [
        "Automatic rejection",
        "Assess against your stated policy, and probe their reasoning live to verify understanding",
        "Ignore it entirely",
      ],
      correctIndex: 1,
      explanation:
        "State the policy up front, then verify comprehension in conversation — that is what you actually need to know.",
    },
    {
      scenario:
        "Which use of AI in hiring is lowest risk?",
      options: [
        "Ranking and rejecting candidates automatically",
        "Drafting consistent, neutral question sets and summarising your own notes",
        "Scoring video interviews on facial expression",
      ],
      correctIndex: 1,
      explanation:
        "AI is safest as a consistency aid to the interviewer. Automated rejection and affect analysis carry serious bias and legal exposure.",
    },
  ],
  46: [
    {
      scenario:
        "A candidate asks whether you asked all applicants the same questions. Why does the answer matter legally?",
      options: [
        "It does not; interviews are informal",
        "Consistency is central evidence that selection was job-related and non-discriminatory",
        "Only written tests carry legal weight",
      ],
      correctIndex: 1,
      explanation:
        "Documented, consistent, job-related questioning is the core defence in any selection challenge.",
    },
    {
      scenario:
        "Which question creates legal risk in most jurisdictions?",
      options: [
        "\"Are you able to perform the essential functions of this role, with or without accommodation?\"",
        "\"Do you have children, or plans to?\"",
        "\"What interests you about this role?\"",
      ],
      correctIndex: 1,
      explanation:
        "Family status questions are non-predictive and unlawful in most jurisdictions. Ask about the requirement, never the personal circumstance.",
    },
    {
      scenario:
        "How long should interview notes be retained and in what form?",
      options: [
        "Deleted immediately after the decision",
        "Retained per policy, factual and job-related, with no personal commentary",
        "Kept informally by each interviewer",
      ],
      correctIndex: 1,
      explanation:
        "Notes are disclosable. Factual, competency-linked records protect the organisation; personal remarks endanger it.",
    },
  ],
  47: [
    {
      scenario:
        "You are hiring across three countries. What should you standardise and what should you localise?",
      options: [
        "Standardise everything for fairness",
        "Standardise competencies and rubric; localise legal questions, comms norms and scheduling",
        "Localise everything to respect culture",
      ],
      correctIndex: 1,
      explanation:
        "The bar must be global for comparability; the mechanics must be local for legality and respect.",
    },
    {
      scenario:
        "A candidate from a high-context culture gives modest, indirect answers about their achievements. How do you avoid misreading them?",
      options: [
        "Ask direct, specific questions about their contribution and score the content",
        "Score lower on confidence",
        "Assume they are being accurate about limited impact",
      ],
      correctIndex: 0,
      explanation:
        "Self-promotion norms vary widely by culture. Direct contribution questions extract the evidence without penalising modesty.",
    },
    {
      scenario:
        "Which practice most improves cross-border interview fairness?",
      options: [
        "Using the same interviewers everywhere",
        "Training all interviewers on the same anchors and reviewing score distributions by location",
        "Translating the job advert only",
      ],
      correctIndex: 1,
      explanation:
        "Shared anchors plus distribution monitoring catches location-level drift that no amount of good intent will.",
    },
  ],
  48: [
    {
      scenario:
        "You must reject a candidate you genuinely liked who was well-prepared. What is the right approach?",
      options: [
        "Delay to avoid the conversation",
        "Deliver the decision promptly, personally, with specific reasoning and genuine warmth",
        "Send a template so it feels less personal",
      ],
      correctIndex: 1,
      explanation:
        "Difficult conversations handled with speed, specificity and respect are what turn rejected candidates into advocates.",
    },
    {
      scenario:
        "A candidate becomes emotional during a rejection call. Best response?",
      options: [
        "End the call quickly to spare them",
        "Acknowledge it, pause, and offer to follow up in writing with the detail",
        "Reopen the decision",
      ],
      correctIndex: 1,
      explanation:
        "Acknowledgement plus a written follow-up respects the person and ensures the useful feedback still lands.",
    },
    {
      scenario:
        "Mid-loop you realise the role has been cancelled. What do you owe the candidates?",
      options: [
        "Immediate, honest notification with an apology and an offer to stay in touch",
        "Wait until it is confirmed in writing internally",
        "Quietly let the process go cold",
      ],
      correctIndex: 0,
      explanation:
        "Going silent is the single most damaging thing you can do to your hiring brand. Tell them fast and honestly.",
    },
  ],
  49: [
    {
      scenario:
        "You review your last ten hires. Three underperformed. What is the most useful analysis?",
      options: [
        "Which interviewers recommended them and what evidence they cited",
        "Which sources they came from",
        "Their tenure at previous employers",
      ],
      correctIndex: 0,
      explanation:
        "Closing the loop between interview evidence and on-the-job outcome is the only way to learn whether your rubric predicts.",
    },
    {
      scenario:
        "You find that candidates you rated highest on 'communication' show no performance difference at 12 months. What should change?",
      options: [
        "Nothing — communication is still important",
        "Re-examine whether that competency is defined and weighted correctly for the role",
        "Remove all soft competencies",
      ],
      correctIndex: 1,
      explanation:
        "A competency with no outcome correlation is either badly defined or wrongly weighted. Validate your rubric against results.",
    },
    {
      scenario:
        "How often should hiring managers review their own scoring patterns?",
      options: [
        "Annually at performance review",
        "Quarterly, alongside outcome data for hires they made",
        "Only when a hire fails",
      ],
      correctIndex: 1,
      explanation:
        "Regular, low-stakes review builds calibration; post-mortems triggered only by failure arrive too late and feel punitive.",
    },
  ],
  50: [
    {
      scenario:
        "Your organisation wants every manager interviewing well, permanently. What actually achieves that?",
      options: [
        "An annual mandatory training course",
        "Continuous short practice, feedback on real scoring data, and visible standards",
        "A detailed interview handbook",
      ],
      correctIndex: 1,
      explanation:
        "Capability is maintained by reinforcement, not by events. Documentation without practice does not change behaviour.",
    },
    {
      scenario:
        "A manager insists their instinct outperforms the rubric. Most effective response?",
      options: [
        "Show them their own hires' outcome data against their scores",
        "Mandate compliance",
        "Exempt them for senior roles",
      ],
      correctIndex: 0,
      explanation:
        "Personal outcome data is the only argument that reliably shifts confident intuition.",
    },
    {
      scenario:
        "Which is the strongest indicator that hiring capability is embedded in a team?",
      options: [
        "Everyone has completed training",
        "Interviewers challenge each other's unevidenced claims in debriefs as a norm",
        "The rubric is published on the intranet",
      ],
      correctIndex: 1,
      explanation:
        "Peer challenge in debriefs is the behavioural proof that the standard is real rather than documented.",
    },
  ],
  51: [
    {
      scenario:
        "You are asked to coach a peer whose interviews are unstructured. Where do you start?",
      options: [
        "Send them the rubric and ask them to use it",
        "Sit in on one interview, then discuss two specific observed moments and one change to try",
        "Report the issue to TA",
      ],
      correctIndex: 1,
      explanation:
        "Specific, observed, small-change coaching works. Generic instruction and escalation both fail to shift practice.",
    },
    {
      scenario:
        "Your feedback to a peer is 'your interviews are too casual'. How should you improve it?",
      options: [
        "Add examples: which competencies went unassessed and which questions were skipped",
        "Soften it to avoid defensiveness",
        "Put it in writing instead",
      ],
      correctIndex: 0,
      explanation:
        "Peer feedback follows the same rule as candidate feedback: name the behaviour and the evidence, not the impression.",
    },
    {
      scenario:
        "A peer pushes back that they have hired well for years. Best move?",
      options: [
        "Concede and drop it",
        "Agree their outcomes matter, and propose comparing independent scores on the next shared candidate",
        "Escalate to their manager",
      ],
      correctIndex: 1,
      explanation:
        "A concrete, low-stakes calibration exercise converts an argument about opinions into shared evidence.",
    },
  ],
  52: [
    {
      scenario:
        "A year of practice complete. What single habit has the highest ongoing return?",
      options: [
        "Writing structured, evidence-based notes immediately after every interview",
        "Interviewing more candidates",
        "Reading more hiring research",
      ],
      correctIndex: 0,
      explanation:
        "Immediate structured notes underpin everything else: accurate scores, honest debriefs, defensible decisions and useful feedback.",
    },
    {
      scenario:
        "How do you keep your capability from decaying over the next year?",
      options: [
        "Repeat the annual training",
        "Keep the spaced practice going and review your scoring against hire outcomes each quarter",
        "Rely on experience accumulating naturally",
      ],
      correctIndex: 1,
      explanation:
        "Experience without feedback entrenches error. Spaced practice plus outcome review is what keeps judgement sharp.",
    },
    {
      scenario:
        "What is the clearest evidence that your hiring capability has genuinely improved this year?",
      options: [
        "You feel more confident in interviews",
        "Your scores predict outcomes better and your panel divergence has narrowed",
        "You hire faster",
      ],
      correctIndex: 1,
      explanation:
        "Predictive accuracy and calibration convergence are the real measures. Confidence and speed can both rise while accuracy falls.",
    },
  ],
};
