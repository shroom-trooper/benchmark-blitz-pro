import type { ElectiveModule } from "./types";

export const functionalModules: ElectiveModule[] = [
  {
    slug: "engineering-technical-assessment",
    title: "Engineering & Technical Assessment",
    category: "functional",
    audience: "Engineering Managers, Tech Leads, Staff Engineers",
    summary:
      "Extract durable engineering signal from coding, design and review exercises instead of trivia and speed.",
    objectives: [
      "Define a technical bar in observable behaviours rather than tool familiarity.",
      "Run coding, design and review exercises that produce comparable evidence.",
      "Separate depth of engineering judgement from surface fluency.",
    ],
    artifact: "A calibrated technical scorecard with per-competency evidence anchors.",
    lessons: [
      {
        slug: "eng-1-defining-the-bar",
        title: "Defining the technical bar",
        focus:
          "Translate the level expectation for the role into observable engineering behaviours before any exercise is chosen.",
        questions: [
          {
            scenario:
              "Your team wants to hire a Senior Engineer. The panel disagrees on what 'senior' means. What is the first artifact you produce?",
            options: [
              "A list of technologies the candidate must have used",
              "A level rubric describing observable behaviours at senior versus mid level",
              "A harder coding exercise so only seniors pass",
            ],
            correctIndex: 1,
            explanation:
              "Difficulty is not a level definition. Behavioural anchors per level let different interviewers agree on what the same evidence means.",
          },
          {
            scenario:
              "A hiring manager insists on five years of a specific framework. The role is a long-lived internal platform. What is the risk?",
            options: [
              "You screen for tool tenure rather than the transferable engineering judgement the platform needs",
              "None — framework depth is the strongest predictor of platform work",
              "You will get too many applicants",
            ],
            correctIndex: 0,
            explanation:
              "Tool tenure is a proxy that ages badly. Specify the judgement the work requires, and let the exercise reveal whether the candidate has it.",
          },
          {
            scenario:
              "Your loop has four interviews, all of which probe coding fluency. What does the coverage map tell you?",
            options: [
              "The bar is very high, which is good",
              "You are sampling one competency four times and have no evidence on design, debugging or collaboration",
              "You should add a fifth coding round for reliability",
            ],
            correctIndex: 1,
            explanation:
              "Repeating one signal inflates confidence without adding coverage. Map each loop stage to a distinct competency.",
          },
        ],
      },
      {
        slug: "eng-2-live-coding-signal",
        title: "Live coding & pairing signal",
        focus:
          "Score reasoning, debugging and collaboration during live exercises rather than whether the solution compiled.",
        questions: [
          {
            scenario:
              "A candidate does not finish the exercise but narrates a clear decomposition and catches their own edge case. How do you score?",
            options: [
              "No hire — the code did not run",
              "Score the observed reasoning and collaboration competencies on their own evidence",
              "Give partial credit invented on the spot",
            ],
            correctIndex: 1,
            explanation:
              "Completion is a single data point. The rubric competencies — decomposition, debugging, communication — are what the exercise exists to measure.",
          },
          {
            scenario:
              "The candidate freezes for two minutes. What is the highest-signal intervention?",
            options: [
              "Wait in silence to see if they recover under pressure",
              "Offer the standard hint you offer every candidate at this point, and note that you used it",
              "Solve the step for them and move on",
            ],
            correctIndex: 1,
            explanation:
              "A pre-agreed hint ladder keeps the exercise comparable across candidates while still measuring what they do with help.",
          },
          {
            scenario:
              "Two candidates solved the task. One used a library shortcut, the other implemented it manually. What is the correct comparison?",
            options: [
              "Prefer the manual implementation — it shows more skill",
              "Prefer the library use — it shows pragmatism",
              "Compare against the rubric competency being measured and ask each candidate to justify the choice",
            ],
            correctIndex: 2,
            explanation:
              "Either choice can be strong. The signal is the justification, not the aesthetic preference of the interviewer.",
          },
        ],
      },
      {
        slug: "eng-3-system-design-depth",
        title: "System design depth probing",
        focus:
          "Push past memorised architecture diagrams to trade-off reasoning, failure modes and operational thinking.",
        questions: [
          {
            scenario:
              "A candidate draws a textbook architecture in ninety seconds. What is your next question?",
            options: [
              "Ask them to add a caching layer",
              "Ask what breaks first at ten times the load and how they would know",
              "Move to the next topic — they clearly know it",
            ],
            correctIndex: 1,
            explanation:
              "Recall is cheap. Failure modes and observability separate people who have operated systems from people who have read about them.",
          },
          {
            scenario:
              "The candidate asks about expected traffic, consistency needs and budget before drawing anything. How do you record this?",
            options: [
              "As stalling — they should start designing",
              "As positive evidence for requirements clarification, one of the design competencies",
              "As neutral, since it is not code",
            ],
            correctIndex: 1,
            explanation:
              "Constraint gathering is a core design behaviour. If your rubric does not reward it, the rubric is missing a competency.",
          },
          {
            scenario:
              "Your interviewers score design very differently for the same candidate. What is the most likely fix?",
            options: [
              "Have only the most senior engineer run design interviews",
              "Define the two or three trade-offs the prompt is designed to surface, and score against those",
              "Drop the design round",
            ],
            correctIndex: 1,
            explanation:
              "Open-ended prompts without a target signal turn into taste tests. Naming the trade-offs makes scores comparable.",
          },
        ],
      },
      {
        slug: "eng-4-takehome-and-review",
        title: "Take-home & code review calibration",
        focus:
          "Keep asynchronous work samples fair, time-boxed and scored blind against a shared review rubric.",
        questions: [
          {
            scenario:
              "Your take-home says 'about four hours' and a candidate spends fourteen. How do you protect fairness?",
            options: [
              "Reward the extra effort — it shows motivation",
              "Score only the criteria in the rubric and state a hard scope, so unlimited time cannot buy score",
              "Disqualify the candidate",
            ],
            correctIndex: 1,
            explanation:
              "Unbounded take-homes penalise candidates with caring responsibilities or a current job. A fixed scope and rubric cap the advantage of extra hours.",
          },
          {
            scenario:
              "Who should review the submission first?",
            options: [
              "The recruiter, to filter volume",
              "A reviewer who cannot see the candidate's name, CV or source, scoring against the rubric",
              "The hiring manager, who already met them",
            ],
            correctIndex: 1,
            explanation:
              "Blind first-pass review is one of the few cheap, high-impact debiasing moves available in technical hiring.",
          },
          {
            scenario:
              "A submission is clean but has no tests, and the rubric lists testing as a scored criterion. The reviewer likes the code style. What happens?",
            options: [
              "Style compensates for the missing tests",
              "Testing is scored low and the recommendation reflects the full rubric, including the gap",
              "The reviewer asks for a resubmission",
            ],
            correctIndex: 1,
            explanation:
              "Letting a strong impression on one criterion cover a gap on another is the halo effect operating inside a rubric.",
          },
        ],
      },
    ],
  },
  {
    slug: "product-design-signal",
    title: "Product & Design Signal Extraction",
    category: "functional",
    audience: "Product Directors, Design Leads, Senior PMs",
    summary:
      "Separate polished storytelling from genuine product judgement, craft depth and cross-functional influence.",
    objectives: [
      "Probe product sense with evidence, not hypotheticals answered from a framework.",
      "Critique portfolios for the candidate's own contribution and decision rationale.",
      "Measure influence without authority as a scored competency.",
    ],
    artifact: "A contribution-verified product and craft evidence sheet.",
    lessons: [
      {
        slug: "pd-1-product-sense",
        title: "Product sense probing",
        focus:
          "Test judgement on a real, messy problem instead of accepting a rehearsed framework recital.",
        questions: [
          {
            scenario:
              "A PM candidate answers every product question with the same acronym framework. What do you do?",
            options: [
              "Score highly — they are structured",
              "Introduce a constraint that breaks the framework and see how they reason",
              "Move on to behavioural questions",
            ],
            correctIndex: 1,
            explanation:
              "Frameworks are rehearsed. Perturbing the problem is how you find out whether judgement sits underneath the structure.",
          },
          {
            scenario:
              "Which prompt produces the strongest product-sense evidence?",
            options: [
              "'How would you improve a well-known consumer app?'",
              "'Walk me through a decision you made with incomplete data, what you gave up, and what happened'",
              "'What is your favourite product and why?'",
            ],
            correctIndex: 1,
            explanation:
              "Past decisions with consequences are checkable and reveal trade-off tolerance. Generic improvement prompts reward familiarity, not judgement.",
          },
          {
            scenario:
              "The candidate describes a launch that failed and what they changed afterwards. How should this be scored?",
            options: [
              "Negatively — the launch failed",
              "As strong evidence if the reasoning and the learning are specific and owned",
              "Neutrally, since outcomes are outside their control",
            ],
            correctIndex: 1,
            explanation:
              "Product work involves failed bets. Penalising honest failure trains candidates to present only sanitised wins.",
          },
        ],
      },
      {
        slug: "pd-2-portfolio-critique",
        title: "Portfolio & craft critique",
        focus:
          "Establish what the candidate personally decided and made, before judging the visual quality of the artefact.",
        questions: [
          {
            scenario:
              "A design portfolio is beautiful. What must you establish before scoring craft?",
            options: [
              "Which parts the candidate personally owned and which the team or agency produced",
              "How many awards the project won",
              "Whether the tools match your stack",
            ],
            correctIndex: 0,
            explanation:
              "Portfolios show team output. Contribution attribution is the prerequisite for any craft judgement.",
          },
          {
            scenario:
              "The candidate cannot explain why they chose one interaction pattern over another. How do you read that?",
            options: [
              "It is fine — the outcome looks good",
              "As a gap in design rationale, one of the scored competencies",
              "As nerves, so ignore it",
            ],
            correctIndex: 1,
            explanation:
              "Rationale is the transferable part of craft. Without it you cannot predict performance on an unfamiliar problem.",
          },
          {
            scenario:
              "A candidate's work is in an unfamiliar domain and looks unusual to your team. What is the fair approach?",
            options: [
              "Score lower — it does not match your house style",
              "Ask them to walk through the constraints of that domain, then score the reasoning",
              "Skip the portfolio round",
            ],
            correctIndex: 1,
            explanation:
              "House-style preference is aesthetic affinity bias. Constraints explain choices that look wrong out of context.",
          },
        ],
      },
      {
        slug: "pd-3-prioritisation-tradeoffs",
        title: "Prioritisation & trade-off evidence",
        focus:
          "Surface what the candidate said no to, and who was unhappy about it.",
        questions: [
          {
            scenario:
              "Which follow-up gives the sharpest prioritisation signal?",
            options: [
              "'What did you ship last quarter?'",
              "'What did you deliberately not ship, and who pushed back?'",
              "'How do you use a prioritisation matrix?'",
            ],
            correctIndex: 1,
            explanation:
              "Prioritisation is visible in the refusals. Shipping lists show activity; cuts show judgement and spine.",
          },
          {
            scenario:
              "A candidate says they prioritised purely by revenue impact. What do you probe?",
            options: [
              "Nothing — revenue is the right lens",
              "How they handled reliability, debt or compliance work with no revenue attached",
              "Whether their revenue numbers were audited",
            ],
            correctIndex: 1,
            explanation:
              "Single-metric prioritisation collapses in real roadmaps. Probing the non-revenue work reveals whether they can balance competing goods.",
          },
          {
            scenario:
              "The candidate describes a trade-off but cannot name the cost of the option they chose. What does that indicate?",
            options: [
              "They made the obviously right call",
              "Weak trade-off reasoning — every real choice has a cost they should be able to name",
              "They were not close enough to the data",
            ],
            correctIndex: 1,
            explanation:
              "If a decision had no downside, it was not a trade-off. Naming the cost is the evidence that the analysis was real.",
          },
        ],
      },
      {
        slug: "pd-4-influence-signal",
        title: "Cross-functional influence signal",
        focus:
          "Score how the candidate moved engineering, design and leadership without formal authority.",
        questions: [
          {
            scenario:
              "A candidate says 'I aligned stakeholders'. What is the highest-value probe?",
            options: [
              "'Who disagreed, what was their argument, and what changed their mind?'",
              "'How many stakeholders were there?'",
              "'Did leadership support you?'",
            ],
            correctIndex: 0,
            explanation:
              "Alignment language is filler until you know the disagreement. The mechanism of persuasion is the actual competency.",
          },
          {
            scenario:
              "The candidate's influence stories all end with escalation to a senior leader. How do you score it?",
            options: [
              "Strong — they know how to use their network",
              "As a partial signal; note the absence of peer-level persuasion evidence",
              "Disqualifying",
            ],
            correctIndex: 1,
            explanation:
              "Escalation is a legitimate tool but a narrow one. The rubric should record which influence behaviours were and were not evidenced.",
          },
          {
            scenario:
              "Engineering on your panel scores the candidate low on collaboration; product scores high. What is the debrief action?",
            options: [
              "Average the scores",
              "Compare the underlying evidence — the two panels may have probed different behaviours",
              "Trust the functional expert",
            ],
            correctIndex: 1,
            explanation:
              "Score divergence is information. Reconciling the evidence, not the numbers, is what a debrief is for.",
          },
        ],
      },
    ],
  },
  {
    slug: "gtm-revenue-hiring",
    title: "Go-To-Market & Revenue Hiring",
    category: "functional",
    audience: "Sales Directors, VP Revenue, CS Leads",
    summary:
      "Verify quota claims, test live selling motion and account for the market conditions behind a track record.",
    objectives: [
      "Verify attainment claims with quota, territory and deal-context detail.",
      "Assess discovery and objection handling through live simulation.",
      "Distinguish personal performance from a favourable market or brand.",
    ],
    artifact: "A verified attainment and motion-fit profile per candidate.",
    lessons: [
      {
        slug: "gtm-1-attainment-verification",
        title: "Quota attainment verification",
        focus:
          "Convert '120% of quota' into a checkable number with quota size, cycle length and deal mix.",
        questions: [
          {
            scenario:
              "A candidate says they hit 140% of quota. What is the first follow-up?",
            options: [
              "'Congratulations — what motivated you?'",
              "'What was the quota number, over what period, and how many reps on your team hit it?'",
              "'Which CRM did you use?'",
            ],
            correctIndex: 1,
            explanation:
              "Percentages are meaningless without the denominator and team context. 140% of a soft quota can be weaker than 90% of a hard one.",
          },
          {
            scenario:
              "Two reps both report strong attainment. One inherited a book of renewals, the other opened a new territory. How do you compare them?",
            options: [
              "Attainment is attainment — treat them equally",
              "Score against the motion your role actually needs, and note the difference explicitly",
              "Prefer the higher percentage",
            ],
            correctIndex: 1,
            explanation:
              "Renewal and new-logo motions predict different things. Matching motion to the open role is more predictive than raw attainment.",
          },
          {
            scenario:
              "A candidate's numbers are strong but they cannot describe a single deal end to end. What does this suggest?",
            options: [
              "They are being appropriately confidential",
              "A gap between claimed and personally-owned performance worth probing further",
              "They are a strategic rather than tactical seller",
            ],
            correctIndex: 1,
            explanation:
              "People who personally closed deals remember the mechanics. Absence of deal-level detail is the classic inflation tell.",
          },
        ],
      },
      {
        slug: "gtm-2-live-pitch-discovery",
        title: "Live pitch & discovery simulation",
        focus:
          "Run a standardised mock discovery call and score questioning quality, not charisma.",
        questions: [
          {
            scenario:
              "In a mock discovery call the candidate pitches for eight minutes before asking a question. How do you score discovery?",
            options: [
              "High — the pitch was polished",
              "Low on discovery, with the pitch scored separately on its own criterion",
              "Restart the exercise",
            ],
            correctIndex: 1,
            explanation:
              "Scoring criteria must stay independent. Presentation polish routinely masks a total absence of discovery discipline.",
          },
          {
            scenario:
              "To keep the simulation fair across candidates, what must be fixed?",
            options: [
              "The persona, the objection you raise and the information you release when asked",
              "The length of the call only",
              "Nothing — natural conversation is more realistic",
            ],
            correctIndex: 0,
            explanation:
              "An improvised roleplay is an unscored variable. A fixed persona and objection script make performances comparable.",
          },
          {
            scenario:
              "The candidate handles your price objection by immediately offering a discount. What is the signal?",
            options: [
              "Commercial pragmatism",
              "Weak value framing — they conceded before testing the underlying concern",
              "Neutral, it depends on the deal",
            ],
            correctIndex: 1,
            explanation:
              "Discounting on first contact with an objection shows the seller had no articulated value case to defend.",
          },
        ],
      },
      {
        slug: "gtm-3-market-context",
        title: "Territory, ICP & market context",
        focus:
          "Adjust for tailwinds: brand strength, category timing and inherited pipeline all inflate a record.",
        questions: [
          {
            scenario:
              "A candidate sold a category-leading product into a booming market. How should this shape your assessment?",
            options: [
              "Treat the record as fully transferable",
              "Probe what they did that a competent average rep in that seat would not have done",
              "Discount them automatically",
            ],
            correctIndex: 1,
            explanation:
              "The right question isolates personal contribution from the tailwind, rather than crediting or dismissing the whole record.",
          },
          {
            scenario:
              "Your role sells an unknown product into a sceptical market. Which background is the closer match?",
            options: [
              "A rep from a dominant brand with huge inbound volume",
              "A rep who built pipeline from cold in an unproven category",
              "The rep with the highest lifetime revenue number",
            ],
            correctIndex: 1,
            explanation:
              "Similarity of selling conditions predicts better than absolute numbers achieved under different conditions.",
          },
          {
            scenario:
              "How do you keep this from becoming an excuse to reject anyone from a big brand?",
            options: [
              "Only interview candidates from startups",
              "Score the specific behaviours the role needs, so brand background is context rather than a verdict",
              "Ignore market context entirely",
            ],
            correctIndex: 1,
            explanation:
              "Context informs interpretation of evidence; it must not replace the evidence with a stereotype about employer size.",
          },
        ],
      },
      {
        slug: "gtm-4-retention-expansion",
        title: "Customer success & expansion signal",
        focus:
          "Assess retention, churn saves and expansion with the same rigour applied to new logo sellers.",
        questions: [
          {
            scenario:
              "A CS candidate reports 95% gross retention. What context do you need?",
            options: [
              "Segment, contract length and whether renewals were auto-renew",
              "Their favourite CS tooling",
              "Team headcount only",
            ],
            correctIndex: 0,
            explanation:
              "Multi-year auto-renew contracts produce high retention with little CS influence. Segment and mechanics decide what the number means.",
          },
          {
            scenario:
              "Which story gives the strongest churn-save signal?",
            options: [
              "'We kept all our accounts that year'",
              "'This account gave notice; here is what I diagnosed, what I changed, and what they said at renewal'",
              "'I built strong relationships with every customer'",
            ],
            correctIndex: 1,
            explanation:
              "A specific save with a diagnosis and an outcome is checkable evidence. The others are summary claims.",
          },
          {
            scenario:
              "A candidate frames every expansion as 'the product sold itself'. How do you read this?",
            options: [
              "Admirable humility, score neutrally and probe for their own actions",
              "Strong evidence of collaboration",
              "Disqualifying modesty",
            ],
            correctIndex: 0,
            explanation:
              "Modesty is not a scoring category. Keep probing until you have their personal actions, or record the evidence as absent.",
          },
        ],
      },
    ],
  },
  {
    slug: "executive-leadership-vetting",
    title: "Executive & Senior Leadership Vetting",
    category: "functional",
    audience: "Founders, C-Suite, Board Members",
    summary:
      "Vet senior leaders on scope, strategy-versus-execution evidence, org-building record and referenced risk.",
    objectives: [
      "Verify the true scope and scale a leader personally owned.",
      "Separate strategic narrative from delivered execution.",
      "Run structured, multi-source referencing on leadership risk.",
    ],
    artifact: "A scope-verified leadership dossier with referenced risk notes.",
    lessons: [
      {
        slug: "exec-1-scope-verification",
        title: "Scope & scale verification",
        focus:
          "Establish budget, headcount, decision rights and what the leader personally owned versus inherited.",
        questions: [
          {
            scenario:
              "A candidate 'led an organisation of 200'. What must you establish?",
            options: [
              "How many reported directly, what budget they controlled and which decisions were theirs to make",
              "The company's total revenue",
              "How long they were in the role",
            ],
            correctIndex: 0,
            explanation:
              "Headcount under a title can include dotted lines and inherited structure. Decision rights are the real measure of scope.",
          },
          {
            scenario:
              "The leader grew a team from 40 to 200 in eighteen months. Which probe matters most?",
            options: [
              "'How did it feel?'",
              "'What broke as you scaled, and what did you change in your operating model?'",
              "'Did you enjoy hiring?'",
            ],
            correctIndex: 1,
            explanation:
              "Rapid growth always breaks something. Naming the failure and the structural response is the evidence of scaling capability.",
          },
          {
            scenario:
              "A candidate's scope shrank in their last role. How do you handle it?",
            options: [
              "Treat it as a red flag and move on",
              "Ask directly about the context — reorg, acquisition or performance — and weigh the answer against references",
              "Ignore it to avoid an awkward conversation",
            ],
            correctIndex: 1,
            explanation:
              "Scope reductions have many causes. Asking directly, then verifying, is more accurate than either assumption.",
          },
        ],
      },
      {
        slug: "exec-2-strategy-vs-execution",
        title: "Strategy narrative vs execution evidence",
        focus:
          "Test whether the compelling strategy story was actually implemented, measured and sustained.",
        questions: [
          {
            scenario:
              "A candidate presents an impressive three-year strategy they authored. What do you ask next?",
            options: [
              "'What was the hardest part to write?'",
              "'What was in market twelve months later, and what did the metrics do?'",
              "'Who approved it?'",
            ],
            correctIndex: 1,
            explanation:
              "Strategy documents are cheap. Implementation and measured movement are what distinguish an operator from a narrator.",
          },
          {
            scenario:
              "The strategy was never implemented because the leader left. How should you score it?",
            options: [
              "As full credit for the thinking",
              "Score the analytical quality, and record that execution evidence is absent",
              "As a no-hire",
            ],
            correctIndex: 1,
            explanation:
              "Split the competencies. Recording the gap honestly is better than either inflating or discarding the evidence you do have.",
          },
          {
            scenario:
              "Every example the candidate gives is at strategy altitude, with no operational detail. What is the concern?",
            options: [
              "None for an executive role",
              "You have no evidence they can operate, which most senior roles still require",
              "They are over-qualified",
            ],
            correctIndex: 1,
            explanation:
              "Altitude-only answers are common in senior candidates. Deliberately pull one example down to weekly operating detail.",
          },
        ],
      },
      {
        slug: "exec-3-org-building",
        title: "Org-building & talent track record",
        focus:
          "Examine who they hired, who they developed, who they exited and where those people are now.",
        questions: [
          {
            scenario:
              "Which is the strongest evidence of leadership talent-building?",
            options: [
              "The candidate's own promotion history",
              "Named people they hired or developed who were subsequently promoted, and who would work with them again",
              "The size of the largest team they managed",
            ],
            correctIndex: 1,
            explanation:
              "Leaders who build capability leave a trail of promoted people. That trail is verifiable through references.",
          },
          {
            scenario:
              "A leader says they 'upgraded the team' by replacing most of it. What do you probe?",
            options: [
              "Nothing — decisive leadership",
              "What they tried before exiting people, and what the retention of the new team looked like",
              "Whether HR approved",
            ],
            correctIndex: 1,
            explanation:
              "Wholesale replacement can be necessary or can be a pattern. The attempted alternatives and the after-state distinguish the two.",
          },
          {
            scenario:
              "A candidate has never hired at the seniority your role requires. How do you treat it?",
            options: [
              "Automatic no-hire",
              "Record it as a stretch and design a targeted assessment around senior hiring judgement",
              "Assume it transfers from junior hiring",
            ],
            correctIndex: 1,
            explanation:
              "Gaps become manageable when they are named and probed, rather than either ignored or treated as fatal.",
          },
        ],
      },
      {
        slug: "exec-4-referencing-risk",
        title: "Board-level referencing & risk",
        focus:
          "Run structured, multi-source references that surface derailers rather than confirming a decision already made.",
        questions: [
          {
            scenario:
              "The candidate supplies three glowing references. What do you do?",
            options: [
              "Accept them — the candidate chose them for a reason",
              "Take them plus at least one back-channel source who reported to the candidate",
              "Skip references at this level",
            ],
            correctIndex: 1,
            explanation:
              "Candidate-selected references are curated. Upward feedback from former reports is where leadership derailers surface.",
          },
          {
            scenario:
              "Which reference question yields the most usable signal?",
            options: [
              "'Would you hire them again?'",
              "'Describe a situation where they were under real pressure — what did the team experience?'",
              "'What are their strengths?'",
            ],
            correctIndex: 1,
            explanation:
              "Behaviour under pressure predicts derailment. Generic strength questions produce politeness, not evidence.",
          },
          {
            scenario:
              "A reference raises a concern about temper that no interview surfaced. What is the correct action?",
            options: [
              "Discount it as one person's opinion",
              "Triangulate with another source and put the finding to the candidate directly",
              "Withdraw immediately",
            ],
            correctIndex: 1,
            explanation:
              "Single-source concerns need verification and a right of reply. Both withdrawing and ignoring skip the evidence step.",
          },
        ],
      },
    ],
  },
];
