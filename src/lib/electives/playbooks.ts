import type { ElectiveModule } from "./types";

export const playbookModules: ElectiveModule[] = [
  {
    slug: "job-spec-loop-architecture",
    title: "Job Specification & Loop Architecture",
    category: "playbook",
    audience: "Hiring Managers, Hiring Chairs, TA Leads",
    summary:
      "Design the role and the loop before the first interview, so every stage produces distinct evidence.",
    objectives: [
      "Write a spec from the work to be done, not a wish list.",
      "Select competencies and map them to loop stages with full coverage.",
      "Assign and prepare interviewers deliberately.",
    ],
    artifact: "A signed-off competency coverage map for the loop.",
    lessons: [
      {
        slug: "spec-1-evidence-based-spec",
        title: "Writing an evidence-based job spec",
        focus:
          "Start from the outcomes the hire must deliver in the first year and work backwards to requirements.",
        questions: [
          {
            scenario:
              "A hiring manager sends a spec with fourteen 'must haves'. What is the intervention?",
            options: [
              "Publish it — better to be thorough",
              "Ask which three the person cannot succeed without, and demote the rest to nice-to-have",
              "Cut the list in half at random",
            ],
            correctIndex: 1,
            explanation:
              "Long must-have lists suppress applications, particularly from under-represented groups, without improving hire quality.",
          },
          {
            scenario:
              "Which opening question produces the best spec?",
            options: [
              "'What should the CV look like?'",
              "'What will be different in twelve months because this person exists?'",
              "'What did the last person in this role do?'",
            ],
            correctIndex: 1,
            explanation:
              "Outcome framing generates a spec tied to real work. CV framing generates a clone of whoever previously held the job.",
          },
          {
            scenario:
              "The spec requires a degree, but the work does not. What is the effect?",
            options: [
              "It raises quality",
              "It filters on a socioeconomic proxy and shrinks the pool without a performance link",
              "It is legally required",
            ],
            correctIndex: 1,
            explanation:
              "Degree requirements unrelated to the work are one of the most common and most costly unjustified filters.",
          },
        ],
      },
      {
        slug: "spec-2-competency-coverage",
        title: "Competencies & coverage mapping",
        focus:
          "Choose four to six competencies and ensure each is assessed at least once, and none four times.",
        questions: [
          {
            scenario:
              "How many competencies should a loop assess in depth?",
            options: [
              "As many as possible",
              "Roughly four to six, each with a named owner in the loop",
              "One per interviewer, however many that is",
            ],
            correctIndex: 1,
            explanation:
              "Beyond about six, interviews become shallow sampling. Named ownership prevents both duplication and gaps.",
          },
          {
            scenario:
              "Your map shows 'collaboration' assessed in every stage and 'domain judgement' in none. What is the fix?",
            options: [
              "Nothing — collaboration is important",
              "Reassign stages so each competency has one or two owners and domain judgement is covered",
              "Add a fifth interview",
            ],
            correctIndex: 1,
            explanation:
              "Coverage maps exist to catch exactly this. Reassignment is cheaper and better than adding stages.",
          },
          {
            scenario:
              "Who signs off the coverage map?",
            options: [
              "The recruiter alone",
              "The hiring manager and the panel, before the first interview is scheduled",
              "Nobody — it is a working document",
            ],
            correctIndex: 1,
            explanation:
              "Sign-off before scheduling is what stops mid-loop redesign, which makes candidates incomparable.",
          },
        ],
      },
      {
        slug: "spec-3-loop-sequencing",
        title: "Designing the loop sequence",
        focus:
          "Order stages so the highest-signal, lowest-cost filters come first and candidate time is respected.",
        questions: [
          {
            scenario:
              "Where should the most predictive, cheapest assessment sit?",
            options: [
              "Last, as a final check",
              "Early, so weak fits are identified before large amounts of candidate and panel time are spent",
              "It does not matter",
            ],
            correctIndex: 1,
            explanation:
              "Front-loading the highest-signal cheap stage minimises total cost for both sides without losing accuracy.",
          },
          {
            scenario:
              "Your loop has seven stages over five weeks. What is the likely outcome?",
            options: [
              "The best possible decision",
              "Strong candidates drop out and accept faster offers elsewhere",
              "Better candidate experience",
            ],
            correctIndex: 1,
            explanation:
              "Loop length is a competitive variable. Beyond a point every extra stage costs more in lost candidates than it adds in accuracy.",
          },
          {
            scenario:
              "A manager wants to add a stage mid-process for one candidate they are unsure about. What do you advise?",
            options: [
              "Add it — more information is better",
              "Do not: it makes the candidate incomparable; instead re-probe the specific gap within the existing structure",
              "Add it for all remaining candidates only",
            ],
            correctIndex: 1,
            explanation:
              "Ad hoc extra stages usually mean an unresolved competency gap. Name the gap and probe it inside the agreed structure.",
          },
        ],
      },
      {
        slug: "spec-4-interviewer-assignment",
        title: "Interviewer assignment & preparation",
        focus:
          "Match interviewers to competencies, brief them, and never let an unprepared interviewer take a slot.",
        questions: [
          {
            scenario:
              "An interviewer joins with no brief and improvises. What is the cost?",
            options: [
              "Minimal — experienced people know what to ask",
              "An unscored, incomparable data point that still influences the debrief",
              "Only a slightly worse candidate experience",
            ],
            correctIndex: 1,
            explanation:
              "Unbriefed interviews still carry weight in the room. That is how unstructured impressions re-enter a structured process.",
          },
          {
            scenario:
              "What is the minimum viable interviewer brief?",
            options: [
              "The CV",
              "The competency they own, the question set, the rubric anchors and the debrief time",
              "The job advert",
            ],
            correctIndex: 1,
            explanation:
              "Those four items are what convert a conversation into comparable evidence.",
          },
          {
            scenario:
              "How do you build panel diversity without tokenism?",
            options: [
              "Ask the same few people from under-represented groups to join every loop",
              "Widen and train the trained-interviewer pool, and track interviewing load per person",
              "Ignore panel composition",
            ],
            correctIndex: 1,
            explanation:
              "Repeatedly drafting the same individuals creates an invisible workload tax. Growing the trained pool is the sustainable fix.",
          },
        ],
      },
    ],
  },
  {
    slug: "debrief-moderation",
    title: "Debrief Moderation & Consensus-Building",
    category: "playbook",
    audience: "Panel Chairs, Lead Recruiters, Hiring Managers",
    summary:
      "Run debriefs that surface evidence rather than defer to the loudest or most senior voice.",
    objectives: [
      "Collect independent scores before any discussion happens.",
      "Manage dominance, anchoring and premature consensus.",
      "Produce a written decision record that survives scrutiny.",
    ],
    artifact: "A written hire decision record with evidence and dissent captured.",
    lessons: [
      {
        slug: "debrief-1-independent-scores",
        title: "Independent scoring before discussion",
        focus:
          "Lock every interviewer's score and evidence before the group talks, to prevent anchoring.",
        questions: [
          {
            scenario:
              "When should interviewers submit scores?",
            options: [
              "Within 24 hours of their interview and before reading anyone else's",
              "During the debrief, together",
              "After the debrief, to reflect the discussion",
            ],
            correctIndex: 0,
            explanation:
              "Independent, pre-discussion scores are the single highest-value debrief control. Everything after that is anchored.",
          },
          {
            scenario:
              "An interviewer has not submitted and joins the debrief anyway. What is the chair's move?",
            options: [
              "Let them speak first",
              "Have them write their score and evidence before the discussion opens",
              "Exclude them entirely",
            ],
            correctIndex: 1,
            explanation:
              "Five minutes of silent writing preserves independence without losing the evidence they hold.",
          },
          {
            scenario:
              "Why does the chair open by reading the scores aloud in a fixed order rather than asking 'thoughts?'",
            options: [
              "It is faster",
              "It prevents the first speaker from setting an anchor everyone else adjusts towards",
              "It is more formal",
            ],
            correctIndex: 1,
            explanation:
              "The first opinion voiced disproportionately shapes the outcome. Fixed-order score reading neutralises it.",
          },
        ],
      },
      {
        slug: "debrief-2-managing-dominance",
        title: "Managing dominant voices",
        focus:
          "Protect junior and dissenting interviewers so their evidence reaches the decision.",
        questions: [
          {
            scenario:
              "The most senior person states a strong opinion first and the room agrees. What has happened?",
            options: [
              "Efficient consensus",
              "Authority anchoring — the remaining evidence was never surfaced",
              "A valid use of experience",
            ],
            correctIndex: 1,
            explanation:
              "Fast unanimity right after a senior opinion is the classic signature of anchoring rather than agreement.",
          },
          {
            scenario:
              "How should the chair sequence contributions?",
            options: [
              "Most senior first",
              "Least senior first, or in submitted-score order, with the hiring manager last",
              "Whoever wants to speak",
            ],
            correctIndex: 1,
            explanation:
              "Speaking order determines whose evidence survives. Junior-first is a cheap, effective structural fix.",
          },
          {
            scenario:
              "One interviewer keeps interrupting a dissenting colleague. What is the chair's responsibility?",
            options: [
              "Stay neutral and let it play out",
              "Intervene, restore the floor, and require the dissent to be recorded in the decision document",
              "Move to a vote",
            ],
            correctIndex: 1,
            explanation:
              "Moderating airtime is the chair's core job. Unrecorded dissent is how avoidable bad hires get made twice.",
          },
        ],
      },
      {
        slug: "debrief-3-conflicting-evidence",
        title: "Resolving conflicting evidence",
        focus:
          "Treat score divergence as data to investigate, not a dispute to average away.",
        questions: [
          {
            scenario:
              "Two interviewers score the same competency 2 and 5. What is the first step?",
            options: [
              "Average to 3.5",
              "Compare the specific evidence each observed and check whether they probed different situations",
              "Ask a third interviewer to break the tie",
            ],
            correctIndex: 1,
            explanation:
              "Averaging destroys information. Divergence usually means different probes, different rubric readings, or one genuinely deeper sample.",
          },
          {
            scenario:
              "The evidence genuinely conflicts and cannot be reconciled. What is the disciplined outcome?",
            options: [
              "Hire and hope",
              "Either run one targeted additional probe on that competency for every finalist, or decide with the gap explicitly recorded",
              "Default to the hiring manager's view",
            ],
            correctIndex: 1,
            explanation:
              "Naming the unresolved risk, or closing it consistently for all finalists, keeps the decision honest and comparable.",
          },
          {
            scenario:
              "A candidate is strong everywhere except one must-have competency. What is the rule?",
            options: [
              "Overall strength compensates",
              "A must-have is by definition non-compensatory — that is what made it a must-have",
              "Downgrade the level and hire",
            ],
            correctIndex: 1,
            explanation:
              "If must-haves can be compensated, they were never must-haves. Decide the compensation rules before the debrief, not during it.",
          },
        ],
      },
      {
        slug: "debrief-4-decision-record",
        title: "Writing the decision record",
        focus:
          "Document the decision, the evidence, the dissent and the onboarding risks in one place.",
        questions: [
          {
            scenario:
              "What belongs in the written decision record?",
            options: [
              "The outcome only",
              "The recommendation, the per-competency evidence, unresolved risks, dissenting views and agreed onboarding focus",
              "The interviewers' personal impressions",
            ],
            correctIndex: 1,
            explanation:
              "That record is what makes the decision auditable, improves the next loop, and gives the new manager a development starting point.",
          },
          {
            scenario:
              "Why record dissent even when the hire goes ahead?",
            options: [
              "For blame later",
              "So the identified risk becomes an onboarding focus, and so patterns are visible when you audit outcomes",
              "It is a legal requirement everywhere",
            ],
            correctIndex: 1,
            explanation:
              "Recorded dissent converts a disagreement into a managed risk and a learning signal for the panel.",
          },
          {
            scenario:
              "How should the record be written given it may be disclosable?",
            options: [
              "Avoid writing anything down",
              "In factual, behavioural, role-relevant language with no personal characteristics or trait labels",
              "In code the panel understands",
            ],
            correctIndex: 1,
            explanation:
              "Behavioural, job-related language is both the fairest and the safest way to write. Not writing loses the evidence entirely.",
          },
        ],
      },
    ],
  },
  {
    slug: "offer-structuring-closing",
    title: "Offer Structuring, Pitching & Closing",
    category: "playbook",
    audience: "Hiring Managers, Dept Heads, TA Partners",
    summary:
      "Build offers on mapped motivation and defensible bands, then close without desperation or pay inequity.",
    objectives: [
      "Map candidate motivation before constructing the offer.",
      "Structure offers that are internally equitable and defensible.",
      "Handle counteroffers, delays and declines professionally.",
    ],
    artifact: "A motivation map and offer rationale attached to each finalist.",
    lessons: [
      {
        slug: "offer-1-motivation-mapping",
        title: "Motivation mapping before the offer",
        focus:
          "Learn what the candidate is actually optimising for well before numbers are discussed.",
        questions: [
          {
            scenario:
              "When should motivation mapping happen?",
            options: [
              "At the offer conversation",
              "Progressively through the loop, so the offer is designed around what they value",
              "After they decline, to learn for next time",
            ],
            correctIndex: 1,
            explanation:
              "By offer stage it is too late to shape the package or the pitch. Motivation is gathered throughout the process.",
          },
          {
            scenario:
              "A candidate says 'money is not the main thing'. How do you use that?",
            options: [
              "Offer below band and save budget",
              "Take it at face value only after identifying what the main thing is, and still offer fairly within band",
              "Assume they are negotiating",
            ],
            correctIndex: 1,
            explanation:
              "Underpaying someone who said money was secondary produces resentment within months and pay inequity immediately.",
          },
          {
            scenario:
              "Which question best surfaces the real driver?",
            options: [
              "'What salary are you looking for?'",
              "'If you had two similar offers, what would decide it for you?'",
              "'Are you interviewing elsewhere?'",
            ],
            correctIndex: 1,
            explanation:
              "The forced-choice framing surfaces the true decision criterion rather than a rehearsed preference list.",
          },
        ],
      },
      {
        slug: "offer-2-structuring",
        title: "Structuring a defensible offer",
        focus:
          "Anchor on level, band and internal equity — never on the candidate's current pay.",
        questions: [
          {
            scenario:
              "What should set the offer number?",
            options: [
              "The candidate's current salary",
              "The assessed level, the band for that level and internal equity with current team members",
              "The lowest number the candidate might accept",
            ],
            correctIndex: 1,
            explanation:
              "Current-pay anchoring perpetuates historical pay gaps and is unlawful to ask in a growing number of jurisdictions.",
          },
          {
            scenario:
              "A candidate negotiates above band. What is the disciplined answer?",
            options: [
              "Exceed the band quietly to win",
              "Re-examine whether they are genuinely a level up; if not, hold band and improve non-cash elements",
              "Withdraw the offer",
            ],
            correctIndex: 1,
            explanation:
              "Out-of-band exceptions create equity problems that surface at the next pay review, usually with the existing team.",
          },
          {
            scenario:
              "Two finalists at the same assessed level receive different offers. What must be true?",
            options: [
              "Nothing — it is a negotiation",
              "The difference must be explainable by documented, job-related factors, not negotiation aggressiveness",
              "The stronger negotiator deserves more",
            ],
            correctIndex: 1,
            explanation:
              "Rewarding negotiation aggressiveness systematically disadvantages groups socialised not to negotiate, and is hard to defend.",
          },
        ],
      },
      {
        slug: "offer-3-delivering-the-pitch",
        title: "Delivering the offer & pitch",
        focus:
          "Deliver live, lead with the mapped motivators, and give the candidate a clear, unhurried decision path.",
        questions: [
          {
            scenario:
              "How should the offer be delivered?",
            options: [
              "By email so the details are clear",
              "Live by the hiring manager, framed around the candidate's motivators, with written details following immediately",
              "By the recruiter only",
            ],
            correctIndex: 1,
            explanation:
              "The live conversation is where the pitch happens and questions surface. The written follow-up is for accuracy.",
          },
          {
            scenario:
              "The candidate asks for two weeks to decide. What is the best response?",
            options: [
              "An exploding 24-hour deadline to force the decision",
              "Ask what they need to resolve, offer help with it, and agree a reasonable date together",
              "Withdraw the offer",
            ],
            correctIndex: 1,
            explanation:
              "Pressure tactics win the occasional signature and lose the candidate within a year, plus the referral network around them.",
          },
          {
            scenario:
              "What most often closes a strong candidate who has options?",
            options: [
              "The highest number",
              "Clarity about the work, the manager relationship and a credible growth path",
              "Perks and office quality",
            ],
            correctIndex: 1,
            explanation:
              "Pay must be competitive, but between comparable offers the deciding factors are usually manager, scope and trajectory.",
          },
        ],
      },
      {
        slug: "offer-4-counteroffers-declines",
        title: "Counteroffers, fallout & declines",
        focus:
          "Handle counteroffers and declines in a way that protects the relationship and improves the next loop.",
        questions: [
          {
            scenario:
              "A candidate accepts a counteroffer from their current employer. What is the right response?",
            options: [
              "Warn them that counteroffers always fail",
              "Wish them well, ask what would have changed their mind, and keep the relationship open",
              "Immediately increase your offer",
            ],
            correctIndex: 1,
            explanation:
              "The decline interview is free, high-quality data. Bidding wars and scare tactics both damage your brand.",
          },
          {
            scenario:
              "Three candidates in a row declined citing the interview process. What is the action?",
            options: [
              "Coincidence — carry on",
              "Treat it as a process defect, review loop length, panel behaviour and communication gaps, and fix one thing",
              "Improve the salary bands",
            ],
            correctIndex: 1,
            explanation:
              "Repeated decline reasons are the most reliable process feedback you will get. Route them to a specific fix.",
          },
          {
            scenario:
              "A candidate goes silent after verbal acceptance. What reduces the risk of this?",
            options: [
              "Nothing can be done",
              "Structured contact through the notice period: manager check-ins, onboarding preview, team introductions",
              "Requiring a deposit",
            ],
            correctIndex: 1,
            explanation:
              "Most renege risk lives in the silent notice period. Planned, warm contact is the standard mitigation.",
          },
        ],
      },
    ],
  },
  {
    slug: "hiring-analytics-audit",
    title: "Hiring Analytics & Panel Accuracy Auditing",
    category: "playbook",
    audience: "VP Talent, Hiring Directors, Ops Leads",
    summary:
      "Measure whether your interviews actually predict performance, and correct the interviewers who do not.",
    objectives: [
      "Choose metrics that predict quality rather than measure activity.",
      "Audit individual interviewer accuracy and calibration.",
      "Detect funnel drop-off and adverse impact early.",
    ],
    artifact: "An interviewer accuracy scorecard reviewed each quarter.",
    lessons: [
      {
        slug: "analytics-1-metrics-that-predict",
        title: "The metrics that actually predict",
        focus:
          "Move from activity metrics to quality-of-hire, pass-through validity and interviewer accuracy.",
        questions: [
          {
            scenario:
              "Which pair of metrics tells you most about hiring quality?",
            options: [
              "Time to hire and number of interviews conducted",
              "New-hire performance at six months versus interview scores, and offer-accept rate by stage feedback",
              "Applications per role and CV screen volume",
            ],
            correctIndex: 1,
            explanation:
              "Quality metrics link the prediction to the outcome. Activity metrics measure how busy the process was.",
          },
          {
            scenario:
              "Time to hire drops 40% and early attrition doubles. What is the interpretation?",
            options: [
              "A clear efficiency win",
              "Speed was bought by cutting evidence — inspect what was removed from the loop",
              "The two are unrelated",
            ],
            correctIndex: 1,
            explanation:
              "Efficiency metrics must always be read against a quality counterweight, or they optimise the wrong thing.",
          },
          {
            scenario:
              "What is the minimum you need to compute interview validity?",
            options: [
              "Interview scores stored per competency, linked to the same people's later performance ratings",
              "Total hires per quarter",
              "Candidate satisfaction surveys",
            ],
            correctIndex: 0,
            explanation:
              "Without stored per-competency scores linked to outcomes, no validity claim about your loop can be tested.",
          },
        ],
      },
      {
        slug: "analytics-2-interviewer-calibration",
        title: "Interviewer accuracy audits",
        focus:
          "Score the scorers: leniency, severity, dissent rate and hit rate against later performance.",
        questions: [
          {
            scenario:
              "An interviewer recommends hire for 95% of candidates. What does this indicate?",
            options: [
              "Excellent sourcing",
              "Near-zero discriminating power — their score adds almost no information to the decision",
              "A generous personality, which is harmless",
            ],
            correctIndex: 1,
            explanation:
              "A signal that never varies carries no information. Retraining or reassignment is the correct response.",
          },
          {
            scenario:
              "Which comparison best measures interviewer accuracy?",
            options: [
              "Their scores versus the panel average",
              "Their scores versus the hired candidates' later performance outcomes",
              "How many interviews they run",
            ],
            correctIndex: 1,
            explanation:
              "Agreement with the panel measures conformity. Agreement with outcomes measures accuracy.",
          },
          {
            scenario:
              "How should accuracy data be used with interviewers?",
            options: [
              "Publish a public ranking",
              "Share privately as calibration coaching, with retraining for outliers and removal only for persistent poor accuracy",
              "Never share it",
            ],
            correctIndex: 1,
            explanation:
              "Coaching improves accuracy; public ranking drives defensive scoring and gaming of the rubric.",
          },
        ],
      },
      {
        slug: "analytics-3-funnel-adverse-impact",
        title: "Funnel drop-off & adverse impact",
        focus:
          "Monitor pass-through by stage and by group so exclusion is caught at the stage that causes it.",
        questions: [
          {
            scenario:
              "One stage passes 70% of one group and 35% of another. What is the first step?",
            options: [
              "Conclude the second group is less qualified",
              "Audit that stage's questions, rubric and interviewers, since a stage-specific gap points at the stage",
              "Set a hiring quota",
            ],
            correctIndex: 1,
            explanation:
              "A gap concentrated at one stage is a property of that stage. Audit the instrument before drawing conclusions about people.",
          },
          {
            scenario:
              "Your sample sizes are small. What is the responsible approach?",
            options: [
              "Ignore the data until you have thousands of candidates",
              "Track over rolling periods, treat findings as prompts to inspect the process, and avoid strong claims from small numbers",
              "Report the percentages as definitive",
            ],
            correctIndex: 1,
            explanation:
              "Small-sample percentages are noisy but still useful as prompts. The error is treating a prompt as proof.",
          },
          {
            scenario:
              "You find adverse impact in a work-sample stage that is genuinely predictive. What next?",
            options: [
              "Remove the stage",
              "Check whether an equally predictive but less exclusionary version exists, and remove any non-predictive elements",
              "Keep it unchanged since it predicts",
            ],
            correctIndex: 1,
            explanation:
              "The standard test is whether a less discriminatory alternative with comparable validity exists. Look for it before defending the current design.",
          },
        ],
      },
      {
        slug: "analytics-4-post-hire-loop",
        title: "Closing the loop with post-hire data",
        focus:
          "Feed six-month performance and retention back into rubrics, panels and specs.",
        questions: [
          {
            scenario:
              "What is the practical closing-the-loop cadence?",
            options: [
              "Compare interview scores against a six-month performance check for every hire, reviewed quarterly",
              "An annual survey of hiring managers",
              "Exit interviews only",
            ],
            correctIndex: 0,
            explanation:
              "A six-month checkpoint is early enough to act on and late enough to be meaningful, and quarterly review makes it a habit.",
          },
          {
            scenario:
              "You find that one competency's interview scores have no relationship to later performance. What do you do?",
            options: [
              "Keep it — it feels important",
              "Investigate whether the assessment is poor or the competency is irrelevant, then fix or remove it",
              "Increase its weight",
            ],
            correctIndex: 1,
            explanation:
              "A non-predictive competency is either badly measured or genuinely irrelevant. Either way the current loop wastes a stage.",
          },
          {
            scenario:
              "A hiring manager says their new hire is 'not what we interviewed'. What is the audit question?",
            options: [
              "'Were the references thorough?'",
              "'Which competency did the loop score highly that is now the problem, and how was it assessed?'",
              "'Should we let them go?'",
            ],
            correctIndex: 1,
            explanation:
              "Tracing the failure to a specific stage and competency is how a single bad hire improves the process for everyone.",
          },
        ],
      },
    ],
  },
];
