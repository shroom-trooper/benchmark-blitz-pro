import type { WeekQuestions } from "../types";

/** Q3 — Candidate Assessment & Bias Mitigation (weeks 27-39) */
export const recruiterQ3: WeekQuestions = {
  27: [
    {
      scenario:
        "You have 15 minutes to assess capability on a phone screen. What is the best structure?",
      options: [
        "Ask ten quick questions across every criterion",
        "Probe two real examples deeply against the two most important criteria",
        "Let the candidate talk through their CV chronologically",
      ],
      correctIndex: 1,
      explanation:
        "Depth on the criteria that matter produces usable evidence; breadth in 15 minutes produces headlines only.",
    },
    {
      scenario: "Which question opens a behavioural deep dive best?",
      options: [
        "\"How would you handle a difficult stakeholder?\"",
        "\"Tell me about the last time a stakeholder blocked your work. What did you do?\"",
        "\"Are you good with stakeholders?\"",
      ],
      correctIndex: 1,
      explanation:
        "A specific, recent, lived example gives you something you can probe; hypotheticals give you their theory of themselves.",
    },
    {
      scenario: "A candidate answers in generalities: \"We usually align early.\" What next?",
      options: [
        "Accept it and move on",
        "Ask for the most recent specific instance and what they personally said or did",
        "Ask whether their team is well organised",
      ],
      correctIndex: 1,
      explanation:
        "Moving from \"we usually\" to \"last time, I did\" is the single highest-value follow-up in screening.",
    },
  ],
  28: [
    {
      scenario:
        "A candidate describes a large result but keeps saying \"we\". How do you validate their contribution?",
      options: [
        "Assume shared credit and score it as partial",
        "Ask what they personally decided and delivered, who else was involved and what would have happened without them",
        "Score it as a strong answer — teamwork is positive",
      ],
      correctIndex: 1,
      explanation:
        "Direct ownership questions separate the people who drove the outcome from those who were nearby when it happened.",
    },
    {
      scenario: "Which part of a STAR answer is most often missing and most important?",
      options: [
        "The situation",
        "The specific action the candidate personally took",
        "The company name",
      ],
      correctIndex: 1,
      explanation:
        "Candidates naturally over-describe context and under-describe their own actions, which is exactly the part that predicts performance.",
    },
    {
      scenario: "A candidate's result sounds implausibly large. What do you do?",
      options: [
        "Challenge them aggressively",
        "Ask calmly how it was measured, over what period and who else saw the numbers",
        "Note it as a red flag and move on silently",
      ],
      correctIndex: 1,
      explanation:
        "Neutral measurement questions test the claim without hostility and usually reveal the truth quickly.",
    },
  ],
  29: [
    {
      scenario: "Which is a leading question you should avoid?",
      options: [
        "\"How did you decide between those two options?\"",
        "\"You must have pushed back on that unrealistic deadline, right?\"",
        "\"What happened next?\"",
      ],
      correctIndex: 1,
      explanation:
        "Signalling the answer you want contaminates the evidence — the candidate simply agrees with you.",
    },
    {
      scenario: "A candidate is struggling to recall an example. What is the fair response?",
      options: [
        "Offer them a scenario to react to instead",
        "Give them a moment, then broaden the timeframe or the context of the question",
        "Move to the next criterion immediately",
      ],
      correctIndex: 1,
      explanation:
        "Broadening the frame keeps the question fair and comparable, while suggesting a scenario changes what you are measuring.",
    },
    {
      scenario: "Why keep silence after a candidate's first answer?",
      options: [
        "To make them uncomfortable",
        "Because candidates often add the most revealing detail in the pause",
        "To save time",
      ],
      correctIndex: 1,
      explanation:
        "A short, comfortable silence is one of the cheapest ways to get depth without leading.",
    },
  ],
  30: [
    {
      scenario:
        "Two screeners score the same candidate 2 and 4 on \"stakeholder management\". Most likely cause?",
      options: [
        "One is a tougher grader by nature",
        "The scale has no behavioural anchors describing what each score looks like",
        "The candidate performed differently on each call",
      ],
      correctIndex: 1,
      explanation:
        "Wide spread almost always means an undefined scale. Anchors turn a subjective number into a shared standard.",
    },
    {
      scenario: "When should you record a screening score?",
      options: [
        "During or immediately after the call, against each criterion",
        "At the end of the week when reviewing all candidates together",
        "Only once the manager has given their view",
      ],
      correctIndex: 0,
      explanation:
        "Immediate, criterion-level scoring avoids memory drift and prevents anchoring on the loudest opinion in the room.",
    },
    {
      scenario: "A candidate is impressive but weak on the top-ranked criterion. How should you score?",
      options: [
        "Raise the overall recommendation because of the overall impression",
        "Score each criterion on its evidence and let the shortlist conversation weigh the trade-off",
        "Drop them without discussion",
      ],
      correctIndex: 1,
      explanation:
        "Honest per-criterion scoring keeps the trade-off visible for the decision-makers instead of hiding it in one number.",
    },
  ],
  31: [
    {
      scenario: "What does affinity bias look like in sourcing specifically?",
      options: [
        "Rejecting candidates for lack of skill",
        "Reaching out disproportionately to people with backgrounds, schools or employers similar to your own network",
        "Preferring candidates who reply quickly",
      ],
      correctIndex: 1,
      explanation:
        "Sourcing bias is set before anyone is interviewed — the pool you build determines who can possibly be hired.",
    },
    {
      scenario: "Which practice most reduces sourcing bias?",
      options: [
        "Reviewing the demographic and background spread of your outreach lists against the mapped market",
        "Screening faster",
        "Relying on referrals",
      ],
      correctIndex: 0,
      explanation:
        "Measuring who you actually contacted against the available market is the only way to see the gap you cannot feel.",
    },
    {
      scenario: "A hiring manager only wants candidates from three named competitors. What do you do?",
      options: [
        "Comply — they know the market",
        "Show what capability exists outside those three and agree a criteria-based bar instead of a company list",
        "Ignore the request quietly",
      ],
      correctIndex: 1,
      explanation:
        "A company list is a proxy for capability. Replacing it with criteria widens the pool without lowering the bar.",
    },
  ],
  32: [
    {
      scenario:
        "Two candidates show identical evidence; one worked at a famous brand. How should that weigh?",
      options: [
        "The brand should break the tie",
        "It should not carry weight on its own — brand is a weak predictor of individual performance",
        "The non-brand candidate should be preferred for diversity",
      ],
      correctIndex: 1,
      explanation:
        "Prestige reflects the company's hiring bar years ago, not this person's capability now. Equal evidence means equal standing.",
    },
    {
      scenario: "What is the best antidote to pedigree bias in shortlist reviews?",
      options: [
        "Presenting evidence against criteria before employer names are discussed",
        "Removing all company information permanently",
        "Asking the manager to be more open-minded",
      ],
      correctIndex: 0,
      explanation:
        "Sequencing the conversation so evidence lands first stops the brand halo from framing everything that follows.",
    },
    {
      scenario: "A manager says \"we only hire from top-tier companies\". Best response?",
      options: [
        "Show the performance outcomes of past hires from both groups and let the data lead",
        "Agree to keep the relationship",
        "Argue that the policy is unfair",
      ],
      correctIndex: 0,
      explanation:
        "Internal outcome data is far more persuasive than principle, and it keeps the conversation professional.",
    },
  ],
  33: [
    {
      scenario: "A candidate has a two-year gap in their CV. What is the appropriate approach?",
      options: [
        "Ask a neutral question about it and focus assessment on current capability",
        "Treat it as a serious risk factor",
        "Avoid mentioning it entirely",
      ],
      correctIndex: 0,
      explanation:
        "Gaps carry little predictive signal. A neutral question gives context; the assessment should rest on demonstrated capability.",
    },
    {
      scenario: "Which candidate should be assessed on the same criteria as everyone else?",
      options: [
        "Only those with a linear career history",
        "Every candidate, regardless of how they arrived at the capability",
        "Only internal candidates",
      ],
      correctIndex: 1,
      explanation:
        "Consistent criteria are what make non-linear paths assessable at all — the route is irrelevant if the evidence is there.",
    },
    {
      scenario: "A returner has been out of the market for three years. What is most useful to assess?",
      options: [
        "Whether their tools knowledge is completely current",
        "Their underlying capability plus a realistic view of what needs refreshing and how fast",
        "Why they left in the first place",
      ],
      correctIndex: 1,
      explanation:
        "Tooling is refreshed quickly; judgement and capability are what take years to build.",
    },
  ],
  34: [
    {
      scenario: "What makes a diverse shortlist actually improve hiring outcomes?",
      options: [
        "Its composition alone",
        "Pairing it with structured, criteria-based evaluation",
        "Presenting it later in the process",
      ],
      correctIndex: 1,
      explanation:
        "A diverse slate evaluated on impressions reproduces the same bias. Structure is what makes the wider pool count.",
    },
    {
      scenario:
        "You can only present three candidates and your strongest four are very similar in background. What do you do?",
      options: [
        "Present the four anyway",
        "Check whether the criteria or the sourcing strategy narrowed the pool before finalising",
        "Swap one out for someone less qualified to add variety",
      ],
      correctIndex: 1,
      explanation:
        "Homogeneous shortlists are usually a symptom of upstream criteria or channels — that is what to fix, not the final list.",
    },
    {
      scenario: "Which sourcing change most widens a slate without lowering the bar?",
      options: [
        "Replacing proxy filters like company and degree with capability evidence",
        "Contacting more people at the same companies",
        "Extending the deadline",
      ],
      correctIndex: 0,
      explanation:
        "Proxies exclude capable people invisibly. Removing them widens the pool at exactly the same standard.",
    },
  ],
  35: [
    {
      scenario:
        "You are not an engineer but must screen engineers. What is the most useful thing you can assess?",
      options: [
        "Syntax knowledge from a checklist",
        "How they reason about trade-offs, scope and decisions in work they have actually done",
        "Which frameworks they list",
      ],
      correctIndex: 1,
      explanation:
        "Reasoning and decision-making are assessable by a non-specialist and predict far more than recalled syntax.",
    },
    {
      scenario:
        "A candidate uses heavy jargon you do not follow. What is the right move?",
      options: [
        "Nod and record it as strong technical depth",
        "Ask them to explain it as they would to a non-technical stakeholder",
        "End the technical part of the screen",
      ],
      correctIndex: 1,
      explanation:
        "The ability to explain complexity simply is both a real signal and a way for you to assess depth honestly.",
    },
    {
      scenario: "Who should design the technical questions on your screen?",
      options: [
        "You, from a generic template",
        "The technical interviewers, aligned to what the loop will test later",
        "Nobody — technical screening should wait",
      ],
      correctIndex: 1,
      explanation:
        "Screen questions written with the technical panel prevent both false passes and wasted interview time.",
    },
  ],
  36: [
    {
      scenario:
        "A self-taught candidate has no formal qualifications but a strong body of shipped work. How should you weigh it?",
      options: [
        "Discount it without formal credentials",
        "Treat the shipped work as primary evidence and probe the decisions behind it",
        "Advance them automatically to show openness",
      ],
      correctIndex: 1,
      explanation:
        "Real work is stronger evidence than a credential — provided you probe the reasoning to confirm ownership and depth.",
    },
    {
      scenario: "What is the fairest way to compare traditional and non-traditional backgrounds?",
      options: [
        "A job-relevant work sample assessed with the same rubric",
        "A longer interview for the non-traditional candidate",
        "A general aptitude test",
      ],
      correctIndex: 0,
      explanation:
        "Work samples measure the job itself, which is what levels the field between different routes into the profession.",
    },
    {
      scenario: "A bootcamp graduate applies for a mid-level role. What should you check first?",
      options: [
        "The bootcamp's reputation",
        "The scope and independence of the work they have done since graduating",
        "The length of the course",
      ],
      correctIndex: 1,
      explanation:
        "What they have delivered since is the evidence; the course is only how they started.",
    },
  ],
  37: [
    {
      scenario: "Which assessment tends to predict job performance best?",
      options: [
        "An unstructured conversation",
        "A job-relevant work sample scored against a rubric",
        "A personality questionnaire",
      ],
      correctIndex: 1,
      explanation:
        "Work samples that mirror the real job are consistently among the most predictive selection methods available.",
    },
    {
      scenario: "How long should a take-home work sample be?",
      options: [
        "As long as needed to fully test everything",
        "Short and tightly scoped, respecting that candidates have jobs and lives",
        "It does not matter if the role is senior",
      ],
      correctIndex: 1,
      explanation:
        "Oversized take-homes select for availability rather than capability, and drive strong candidates away.",
    },
    {
      scenario: "What must exist before a work sample is sent out?",
      options: [
        "A scoring rubric agreed with the people who will review it",
        "A signed NDA",
        "A deadline of 24 hours",
      ],
      correctIndex: 0,
      explanation:
        "Without an agreed rubric the submissions are judged on taste, which wastes the candidate's effort.",
    },
  ],
  38: [
    {
      scenario: "What is the purpose of calibrating your screen with the technical panel?",
      options: [
        "To make the screen harder",
        "To ensure the people you pass consistently clear the loop, and understand why the ones who fail do not",
        "To let the panel choose the candidates",
      ],
      correctIndex: 1,
      explanation:
        "Alignment between screen and loop is what protects panel time and keeps your pass rate credible.",
    },
    {
      scenario:
        "Every candidate you pass is failing the technical interview. What should you do first?",
      options: [
        "Pass fewer candidates",
        "Sit in on a loop or review the failure reasons with the panel and adjust the screen",
        "Ask the panel to lower the bar",
      ],
      correctIndex: 1,
      explanation:
        "Understanding the specific failure reasons is what lets you fix the screen rather than just reducing volume.",
    },
    {
      scenario: "How often should recruiter-panel calibration happen on an active search?",
      options: [
        "Once at the start only",
        "Regularly while the search is live, using real candidate examples",
        "Only when there is a problem",
      ],
      correctIndex: 1,
      explanation:
        "Calibration drifts as the market and the manager's thinking evolve; regular reviews on real candidates keep it aligned.",
    },
  ],
  39: [
    {
      scenario:
        "Looking back at a completed loop, what is the strongest indicator the assessment was fair?",
      options: [
        "Every candidate faced the same criteria with recorded evidence, and decisions cite that evidence",
        "The panel reached consensus quickly",
        "The chosen candidate had the best CV",
      ],
      correctIndex: 0,
      explanation:
        "Fairness is visible in the record: same criteria, real evidence, decisions traceable to both.",
    },
    {
      scenario: "A debrief drifts into \"culture fit\" language. What is the right intervention?",
      options: [
        "Let it run — fit matters",
        "Ask what specific behaviour was observed and which agreed criterion it maps to",
        "End the debrief",
      ],
      correctIndex: 1,
      explanation:
        "Requiring behaviour and criterion converts a bias-prone phrase into either real evidence or nothing at all.",
    },
    {
      scenario: "What single habit most improves assessment quality over a quarter?",
      options: [
        "Interviewing more candidates",
        "Writing evidence against criteria immediately and reviewing score spread across screeners",
        "Shortening every interview",
      ],
      correctIndex: 1,
      explanation:
        "Immediate evidence plus regular spread reviews is what keeps a whole team calibrated rather than individually confident.",
    },
  ],
};
