import type { WeekQuestions } from "./types";

export const q2Questions: WeekQuestions = {
  14: [
    {
      scenario:
        "Five minutes in, you discover the candidate went to your university and plays the same sport. You feel the interview warming up. What now?",
      options: [
        "Enjoy it — rapport helps candidates perform",
        "Note the affinity trigger, park the small talk, and hold to the rubric",
        "End the interview and hand it to a colleague",
      ],
      correctIndex: 1,
      explanation:
        "Naming the affinity trigger to yourself is the intervention. Shared background inflates scores by up to 70% when it goes unnoticed.",
    },
    {
      scenario:
        "Which safeguard most reduces affinity bias across a hiring loop?",
      options: [
        "Comparing each candidate against the rubric anchors rather than against each other",
        "Interviewing candidates in a random order",
        "Keeping interviews shorter",
      ],
      correctIndex: 0,
      explanation:
        "Absolute scoring against defined anchors prevents 'people like me' from becoming the implicit reference point.",
    },
    {
      scenario:
        "A panel member writes: \"Really easy conversation — felt like they'd been on the team for years.\" How should the debrief treat this?",
      options: [
        "As strong positive evidence of collaboration",
        "As an impression requiring behavioural evidence before it can influence a score",
        "As a neutral comment to ignore entirely",
      ],
      correctIndex: 1,
      explanation:
        "Familiarity feels like fit. Ask what the candidate did, not how the conversation felt.",
    },
  ],
  15: [
    {
      scenario:
        "A candidate avoids eye contact, speaks in a flat tone, and answers precisely and thoroughly. How do you score communication?",
      options: [
        "Lower — presence is part of communication",
        "On the clarity and completeness of the information conveyed, not on eye contact or affect",
        "Ask them to try again with more energy",
      ],
      correctIndex: 1,
      explanation:
        "Eye contact and affect are cultural and neurological, not competence. Score what the role actually requires: clear information transfer.",
    },
    {
      scenario:
        "What is the most effective inclusive practice for neurodivergent candidates?",
      options: [
        "Sending the questions or interview structure in advance to every candidate",
        "Asking whether they have a diagnosis",
        "Making the interview more conversational",
      ],
      correctIndex: 0,
      explanation:
        "Sharing the structure with everyone removes the need to disclose, reduces working-memory load, and improves signal for all candidates.",
    },
    {
      scenario:
        "A candidate asks for a written version of a verbal case exercise. What is the right response?",
      options: [
        "Decline — it would give them an advantage",
        "Provide it, and consider making written cases the default for all candidates",
        "Provide it but note the request in the scorecard",
      ],
      correctIndex: 1,
      explanation:
        "The format is not the competency. Accommodating it — and standardising it — measures the skill you actually care about.",
    },
  ],
  16: [
    {
      scenario:
        "Four minutes in you think \"this is a yes\". What is the risk for the remaining 40 minutes?",
      options: [
        "None — first impressions are usually accurate",
        "You will unconsciously ask easier questions and interpret ambiguity favourably",
        "You will run out of questions",
      ],
      correctIndex: 1,
      explanation:
        "Once a decision forms, interviewers gather confirming evidence. The remaining time validates the hunch instead of testing it.",
    },
    {
      scenario:
        "Which practice most directly counters confirmation bias?",
      options: [
        "Deliberately probing for evidence that would disprove your early impression",
        "Waiting until the end to form a view without any technique",
        "Having a longer interview",
      ],
      correctIndex: 0,
      explanation:
        "Actively seeking disconfirming evidence is the tested intervention: ask what would have to be true for you to be wrong.",
    },
    {
      scenario:
        "You scored a candidate 5/5 on ownership based on one strong story. What should you have done?",
      options: [
        "Nothing — one clear example is enough",
        "Probe a second, different example before assigning the top anchor",
        "Score 3 by default to be safe",
      ],
      correctIndex: 1,
      explanation:
        "A single rehearsed story is weak evidence for a top rating. Two independent examples test whether the behaviour is consistent.",
    },
  ],
  17: [
    {
      scenario:
        "A candidate previously worked at a famous, admired company. You notice your ratings across all competencies trending high. What is happening?",
      options: [
        "Halo effect — one attribute is inflating unrelated scores",
        "Legitimate correlation — good companies hire good people",
        "Horn effect",
      ],
      correctIndex: 0,
      explanation:
        "Brand prestige is a classic halo trigger. Each competency must be scored on its own evidence.",
    },
    {
      scenario:
        "A candidate mispronounces a product name early on and you find yourself scoring them down on domain depth. What is this?",
      options: [
        "Reasonable — attention to detail matters",
        "Horn effect: a trivial flaw is contaminating unrelated evaluation",
        "Confirmation bias only",
      ],
      correctIndex: 1,
      explanation:
        "A minor negative can drag every score. Isolate the observation and ask whether it is actually in the rubric.",
    },
    {
      scenario:
        "What structural change best limits halo and horn effects?",
      options: [
        "Scoring each competency independently, immediately after the segment that assessed it",
        "Giving one overall rating at the end",
        "Adding more interviewers",
      ],
      correctIndex: 0,
      explanation:
        "Segment-by-segment scoring stops a single impression from spreading across the whole scorecard.",
    },
  ],
  18: [
    {
      scenario:
        "Your standard opener is: \"We're looking for a real rockstar who can dominate this space.\" What is the effect?",
      options: [
        "It energises ambitious candidates",
        "Aggressive, gendered-coded language measurably narrows who progresses",
        "It has no measurable effect in interviews",
      ],
      correctIndex: 1,
      explanation:
        "Coded language shapes who self-selects onward. Neutral phrasing increases diverse candidate progression by about a quarter.",
    },
    {
      scenario:
        "Which phrasing is most inclusive when asking about availability?",
      options: [
        "\"Does your husband or wife mind the travel?\"",
        "\"This role includes roughly one trip per month — does that work for you?\"",
        "\"Do you have any family commitments that would get in the way?\"",
      ],
      correctIndex: 1,
      explanation:
        "State the requirement, ask about the requirement. Questions about partners or family are both non-predictive and legally risky.",
    },
    {
      scenario:
        "A colleague says inclusive language is \"just walking on eggshells\". Best reply?",
      options: [
        "It is about precision: describing the job requirement instead of a stereotype improves the signal",
        "Agree, but comply anyway",
        "It only matters in the job advert",
      ],
      correctIndex: 0,
      explanation:
        "Inclusive language is precise language. It improves the accuracy of the assessment as well as the fairness.",
    },
  ],
  19: [
    {
      scenario:
        "A candidate's English is accented and occasionally hesitant, but the technical content is exact. How do you score technical competency?",
      options: [
        "Slightly lower to reflect communication risk",
        "On the technical accuracy alone; assess communication separately and only as the role requires",
        "Ask them to repeat answers until fluent",
      ],
      correctIndex: 1,
      explanation:
        "Fluency is routinely confused with cognitive ability. Separate the competencies and only weight language to the degree the job truly needs it.",
    },
    {
      scenario:
        "What is the fairest way to reduce language load in an interview?",
      options: [
        "Speak faster to save time for their answers",
        "Avoid idioms, allow extra thinking time, and share questions in writing",
        "Use simpler technical vocabulary throughout",
      ],
      correctIndex: 1,
      explanation:
        "Idioms and time pressure penalise non-native speakers without measuring anything job-relevant. Simplifying the technical content, by contrast, lowers the bar.",
    },
    {
      scenario:
        "When is language proficiency a legitimate scored competency?",
      options: [
        "Always, for any customer-facing company",
        "When the role genuinely requires that proficiency, defined at the level the work demands",
        "Never",
      ],
      correctIndex: 1,
      explanation:
        "Assess it if the job requires it — but define the required level explicitly rather than defaulting to native-like fluency.",
    },
  ],
  20: [
    {
      scenario:
        "A candidate says: \"I've only done about 70% of this role before.\" Another candidate with a weaker CV says they are a perfect fit. How do you read this?",
      options: [
        "The confident candidate is more capable",
        "Self-assessment confidence varies by group; score demonstrated evidence, not self-rating",
        "The candid candidate is under-qualified",
      ],
      correctIndex: 1,
      explanation:
        "Application and self-rating thresholds differ sharply across groups. Confidence is not competence — go back to the evidence.",
    },
    {
      scenario:
        "How should you handle a candidate who consistently says \"we\" when describing achievements?",
      options: [
        "Score lower on ownership",
        "Probe explicitly: \"What was your specific contribution to that?\"",
        "Assume they are exaggerating team credit",
      ],
      correctIndex: 1,
      explanation:
        "Credit-sharing language is culturally and demographically patterned. Probing isolates individual contribution without penalising humility.",
    },
    {
      scenario:
        "Your shortlist skews heavily one way after screening on \"meets all criteria\". What should you check?",
      options: [
        "Nothing — the criteria are objective",
        "Whether 'must-haves' are genuinely essential, since over-specified requirements filter groups asymmetrically",
        "Whether recruiters sourced enough candidates",
      ],
      correctIndex: 1,
      explanation:
        "Inflated must-have lists disproportionately screen out groups who apply only at 100% match. Audit essential versus desirable.",
    },
  ],
  21: [
    {
      scenario:
        "A panel rejects a 58-year-old candidate as \"probably overqualified and would get bored\". What is your read?",
      options: [
        "Reasonable retention risk management",
        "An assumption stated as fact — ask the candidate directly about motivation instead",
        "A valid culture concern",
      ],
      correctIndex: 1,
      explanation:
        "\"Overqualified\" is one of the most common cover phrases for age bias. Replace the assumption with a direct motivation question.",
    },
    {
      scenario:
        "A 24-year-old candidate is dismissed as \"not ready to lead\". What evidence should you require?",
      options: [
        "Their age relative to the team",
        "Behavioural evidence against the leadership competencies in the rubric",
        "Years of management experience only",
      ],
      correctIndex: 1,
      explanation:
        "Both ends of the age range attract assumptions. The rubric — not the birth year — decides readiness.",
    },
    {
      scenario:
        "Which question about career longevity is both fair and predictive?",
      options: [
        "\"How much longer do you plan to work?\"",
        "\"What would make this role a great next three years for you?\"",
        "\"Are you thinking about retirement?\"",
      ],
      correctIndex: 1,
      explanation:
        "Ask everyone the same forward-looking motivation question. Age-referencing questions are non-predictive and discriminatory.",
    },
  ],
  22: [
    {
      scenario:
        "One candidate is polished and uses consultancy vocabulary; another gives substantive answers in plain language. What is the bias risk?",
      options: [
        "None — polish reflects preparation",
        "Presentation polish tracks socioeconomic background more than capability",
        "Plain language signals weaker thinking",
      ],
      correctIndex: 1,
      explanation:
        "Polish is a learned class signal. Score the substance of the answer against the rubric, not the packaging.",
    },
    {
      scenario:
        "A candidate has non-linear work history including retail and caring responsibilities. How should the panel treat the gaps?",
      options: [
        "As a commitment risk",
        "Ask what they did and learned in that period, exactly as you would probe any other role",
        "Ignore that period entirely",
      ],
      correctIndex: 1,
      explanation:
        "Non-traditional paths often carry directly relevant competencies. Treat every period as evidence-gathering, not as a red flag.",
    },
    {
      scenario:
        "Which screening criterion most often introduces socioeconomic bias?",
      options: [
        "Requiring a degree from a specific set of universities",
        "Requiring evidence of a specific skill",
        "Requiring a work sample",
      ],
      correctIndex: 0,
      explanation:
        "University prestige is a proxy for background, not performance. Skill and work-sample criteria measure the job.",
    },
  ],
  23: [
    {
      scenario:
        "A candidate discloses they need extra time for a timed assessment. What is the correct response?",
      options: [
        "Grant it and record nothing about the request in the scorecard",
        "Grant it but note the candidate needed help",
        "Explain the assessment is standardised and cannot change",
      ],
      correctIndex: 0,
      explanation:
        "Accommodations remove barriers, they do not lower the bar — and the request must never appear as evidence in the evaluation.",
    },
    {
      scenario:
        "When should accommodations be offered?",
      options: [
        "Only when a candidate asks",
        "Proactively, to every candidate, at scheduling",
        "Only for candidates who disclose a disability",
      ],
      correctIndex: 1,
      explanation:
        "Proactive offers remove the disclosure penalty and measurably raise overall candidate performance scores.",
    },
    {
      scenario:
        "Which is a genuine accessibility improvement to a standard interview loop?",
      options: [
        "Sharing the agenda, interviewer names, and question format in advance",
        "Making the interview shorter for everyone",
        "Allowing candidates to skip a competency",
      ],
      correctIndex: 0,
      explanation:
        "Advance information reduces cognitive and anxiety load without changing what is assessed.",
    },
  ],
  24: [
    {
      scenario:
        "Your four-person panel has identical backgrounds and functions. What is the main risk?",
      options: [
        "Interview fatigue",
        "Correlated blind spots — four people making the same evaluation error",
        "Scheduling difficulty",
      ],
      correctIndex: 1,
      explanation:
        "Panel diversity works because it decorrelates errors, cutting single-interviewer bias by over 40%.",
    },
    {
      scenario:
        "One panel member interrupts a colleague repeatedly during the interview. As the hiring manager, what should you do?",
      options: [
        "Address it after and reassign competency ownership so each interviewer has protected segments",
        "Say nothing to avoid conflict",
        "Remove the interrupted interviewer's score",
      ],
      correctIndex: 0,
      explanation:
        "Panel dynamics distort both the candidate's experience and the evidence collected. Assign clear segment ownership.",
    },
    {
      scenario:
        "How should panel members divide the rubric?",
      options: [
        "Everyone assesses everything for maximum coverage",
        "Each competency is owned by named interviewers, with at least two views on the highest-weighted ones",
        "Whoever has time covers what they can",
      ],
      correctIndex: 1,
      explanation:
        "Deliberate allocation gives depth and redundancy where it matters, instead of four shallow passes over the same ground.",
    },
  ],
  25: [
    {
      scenario:
        "Your data shows fair outcomes by gender and fair outcomes by ethnicity, but women from one ethnic group are rejected at twice the rate. What does this show?",
      options: [
        "A sampling artefact you can ignore",
        "Intersectional bias, invisible in single-axis analysis",
        "That the rubric is too strict overall",
      ],
      correctIndex: 1,
      explanation:
        "Compounding identities create distinct patterns. Single-axis reporting can look clean while an intersection is failing.",
    },
    {
      scenario:
        "How should TA report interview outcome data to surface this?",
      options: [
        "By each demographic dimension separately",
        "By intersecting dimensions where sample sizes allow, alongside single-axis views",
        "Only in aggregate to protect privacy",
      ],
      correctIndex: 1,
      explanation:
        "Intersectional cuts are the only way to see compounding effects; single-axis views are necessary but not sufficient.",
    },
    {
      scenario:
        "A panel member says \"we hired several women last year, so we don't have a bias problem\". Best response?",
      options: [
        "Accept it as evidence of progress",
        "Point out that aggregate hires say nothing about how specific intersections were evaluated",
        "Ask for a bias training refresher only",
      ],
      correctIndex: 1,
      explanation:
        "Headcount outcomes are not evaluation fairness. The question is how each group was scored at each stage.",
    },
  ],
  26: [
    {
      scenario:
        "Quarter recap: which intervention most reliably reduces evaluation bias?",
      options: [
        "Reminding interviewers to be objective before each interview",
        "Structural changes: shared anchors, independent scoring, and evidence-based debriefs",
        "Longer unconscious bias workshops",
      ],
      correctIndex: 1,
      explanation:
        "Awareness alone fades. Structure changes behaviour by removing the moments where bias operates unchecked.",
    },
    {
      scenario:
        "Why does consistent bias training reduce candidate drop-off during loops?",
      options: [
        "Because interviews get shorter",
        "Because candidates experience fair, consistent, respectful evaluation and stay engaged",
        "Because fewer candidates are invited",
      ],
      correctIndex: 1,
      explanation:
        "Fairness is felt. Consistent processes cut voluntary drop-off during hiring loops by roughly a third.",
    },
    {
      scenario:
        "You catch yourself mid-interview making an assumption about a candidate. What is the best in-the-moment action?",
      options: [
        "Suppress the thought and continue",
        "Name it internally, then deliberately ask a question that could disconfirm it",
        "Note it in the scorecard as a concern",
      ],
      correctIndex: 1,
      explanation:
        "Suppression does not work; redirection does. Convert the assumption into a testable question.",
    },
  ],
};
