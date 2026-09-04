import type { ElectiveModule } from "./types";

export const operationalModules: ElectiveModule[] = [
  {
    slug: "startup-speed-hiring",
    title: "Startup & High-Growth Speed Hiring",
    category: "operational",
    audience: "Founders, High-Growth Managers, Talent Partners",
    summary:
      "Compress the loop to days without quietly lowering the bar or losing evidence.",
    objectives: [
      "Design a two-to-three stage loop that keeps full competency coverage.",
      "Assess zero-to-one and ambiguity tolerance directly.",
      "Sell a high-risk opportunity honestly and close fast.",
    ],
    artifact: "A compressed loop design with a preserved competency coverage map.",
    lessons: [
      {
        slug: "startup-1-compressed-loop",
        title: "Compressed loop design",
        focus:
          "Cut stages, not competencies — merge coverage deliberately rather than dropping evidence.",
        questions: [
          {
            scenario:
              "You must go from five interviews to three. What is the correct first step?",
            options: [
              "Delete the two interviews people find least enjoyable",
              "Map every competency to a stage, then merge stages that duplicate coverage",
              "Shorten every interview to twenty minutes",
            ],
            correctIndex: 1,
            explanation:
              "Duplicate coverage is the cheapest thing to cut. Removing stages at random silently deletes competencies from the decision.",
          },
          {
            scenario:
              "A founder wants to decide after one 30-minute conversation. What is the risk you name?",
            options: [
              "The candidate may feel undervalued",
              "One unstructured sample is dominated by first impressions and has almost no predictive validity",
              "There will not be enough time to sell the role",
            ],
            correctIndex: 1,
            explanation:
              "Speed is fine; a single unstructured sample is not. Even a compressed loop needs structured, independent evidence.",
          },
          {
            scenario:
              "You compress the loop to 48 hours. What must be prepared in advance?",
            options: [
              "The rubric, interviewer assignments and debrief slot, all booked before the first call",
              "Only the offer letter",
              "A longer take-home to compensate",
            ],
            correctIndex: 0,
            explanation:
              "Speed comes from pre-scheduling and pre-agreement, not from skipping steps in the moment.",
          },
        ],
      },
      {
        slug: "startup-2-ambiguity-signal",
        title: "Ambiguity & zero-to-one signal",
        focus:
          "Look for evidence of building without process, headcount or clear requirements.",
        questions: [
          {
            scenario:
              "Which question best surfaces zero-to-one capability?",
            options: [
              "'How do you handle ambiguity?'",
              "'Tell me about something you started when nobody asked you to — what existed when you finished?'",
              "'Do you prefer structure or chaos?'",
            ],
            correctIndex: 1,
            explanation:
              "Self-report about ambiguity is unfalsifiable. A built artefact with a before-and-after is evidence.",
          },
          {
            scenario:
              "A candidate from a large, well-resourced company gives strong answers but always had support functions. What do you probe?",
            options: [
              "Nothing — big company experience is a plus",
              "A concrete example where the support did not exist and they did the work themselves",
              "Whether they would accept a pay cut",
            ],
            correctIndex: 1,
            explanation:
              "The environment change is the real risk. Probe for the specific behaviours the new environment demands.",
          },
          {
            scenario:
              "How do you avoid turning 'startup fit' into a proxy for youth or long hours?",
            options: [
              "Define it as observable behaviours: self-directed scoping, tolerance for incomplete data, rapid iteration",
              "Ask about hours worked per week",
              "Prefer candidates with startup logos on their CV",
            ],
            correctIndex: 0,
            explanation:
              "Undefined 'fit' language is where age and lifestyle bias enter. Behavioural definitions keep it lawful and predictive.",
          },
        ],
      },
      {
        slug: "startup-3-speed-without-lowering-bar",
        title: "Speed without lowering the bar",
        focus:
          "Protect the decision quality when urgency and headcount pressure push towards a yes.",
        questions: [
          {
            scenario:
              "The team is desperate and the only candidate in the pipeline is borderline. What is the disciplined move?",
            options: [
              "Hire — an imperfect hire beats an empty seat",
              "Compare against the written bar, and if it is a no, fix the top of the funnel instead",
              "Lower the level and hire anyway without changing the spec",
            ],
            correctIndex: 1,
            explanation:
              "Urgency-driven yeses are the most expensive hires in a small team. The written bar exists precisely for this moment.",
          },
          {
            scenario:
              "You genuinely need to hire at a lower level than planned. What must change?",
            options: [
              "Nothing — just make the offer",
              "The spec, the rubric, the level expectation and the onboarding plan, all updated explicitly",
              "Only the salary",
            ],
            correctIndex: 1,
            explanation:
              "Changing the level is legitimate. Doing it implicitly, while still measuring against the old bar, is what causes failure.",
          },
          {
            scenario:
              "What is the cheapest safeguard in a fast loop?",
            options: [
              "A pre-committed 'we will not hire unless' list of two or three non-negotiables",
              "A longer reference process",
              "A second offer approval layer",
            ],
            correctIndex: 0,
            explanation:
              "Pre-commitment made before you meet anyone is far more resistant to urgency than judgement made under pressure.",
          },
        ],
      },
      {
        slug: "startup-4-selling-the-bet",
        title: "Selling a high-risk opportunity",
        focus:
          "Pitch honestly — risk disclosed early costs less than an early regret hire.",
        questions: [
          {
            scenario:
              "A candidate asks about runway. What is the correct response?",
            options: [
              "Deflect until after they sign",
              "Give an honest range and explain what would change it",
              "Overstate to protect the offer",
            ],
            correctIndex: 1,
            explanation:
              "Runway surprises produce early attrition and reputational damage. Honesty filters for people who can accept the risk.",
          },
          {
            scenario:
              "Which pitch is most effective for a strong candidate weighing a safer offer?",
            options: [
              "Emphasising equity upside alone",
              "Naming the specific problem they would own, the scope, and what success unlocks for their career",
              "Matching the other offer's base salary",
            ],
            correctIndex: 1,
            explanation:
              "Scope and ownership are the assets a startup actually has. Competing purely on cash or lottery-ticket equity rarely wins.",
          },
          {
            scenario:
              "The candidate raises a legitimate concern about the market. What is the strongest move?",
            options: [
              "Agree it is a real risk, share your evidence and reasoning, and let them decide",
              "Reassure them that it will work out",
              "Change the subject to culture",
            ],
            correctIndex: 0,
            explanation:
              "Treating a sharp candidate as a peer in the risk assessment is more persuasive and more honest than reassurance.",
          },
        ],
      },
    ],
  },
  {
    slug: "async-distributed-assessment",
    title: "Asynchronous & Distributed Assessment",
    category: "operational",
    audience: "Remote Managers, Distributed Leads",
    summary:
      "Assess fairly across time zones using written work samples and structured async evidence.",
    objectives: [
      "Design async work samples that produce comparable evidence.",
      "Score written communication as a first-class competency.",
      "Remove time-zone penalties from the loop.",
    ],
    artifact: "An async-fair loop template with written work-sample rubric.",
    lessons: [
      {
        slug: "async-1-work-samples",
        title: "Designing async work samples",
        focus:
          "Build time-boxed, realistic tasks that can be scored blind and consistently.",
        questions: [
          {
            scenario:
              "What makes an async work sample fair as well as predictive?",
            options: [
              "A fixed scope, a stated time box, a published rubric and blind review",
              "A very hard problem that few can complete",
              "An open brief so candidates can show creativity",
            ],
            correctIndex: 0,
            explanation:
              "Fairness and comparability come from scope and rubric. Open briefs produce incomparable submissions and reward free time.",
          },
          {
            scenario:
              "Candidates in different time zones get the brief at different local hours. What do you standardise?",
            options: [
              "The deadline time in your own zone",
              "The window length each candidate gets, not the wall-clock deadline",
              "Nothing — deadlines should be identical",
            ],
            correctIndex: 1,
            explanation:
              "An identical wall-clock deadline gives some candidates a night's sleep and others none. Equal windows are the fair unit.",
          },
          {
            scenario:
              "A candidate declines an unpaid multi-day exercise. How should this be recorded?",
            options: [
              "As a lack of motivation",
              "As a process problem on your side — offer a shorter or compensated alternative",
              "As an automatic withdrawal",
            ],
            correctIndex: 1,
            explanation:
              "Long unpaid exercises filter by privilege rather than capability. A shorter, scoped alternative preserves both fairness and signal.",
          },
        ],
      },
      {
        slug: "async-2-written-communication",
        title: "Written communication signal",
        focus:
          "In distributed teams, writing is the job — score clarity, structure and audience awareness explicitly.",
        questions: [
          {
            scenario:
              "How should written communication appear in a distributed role's loop?",
            options: [
              "As a scored competency with its own rubric and a written artefact",
              "As a general impression from email exchanges",
              "It should not be scored — it is a soft skill",
            ],
            correctIndex: 0,
            explanation:
              "If a competency drives on-the-job success it belongs in the rubric with its own evidence, not in an impression.",
          },
          {
            scenario:
              "A candidate writes fluently but buries the decision on page two. How do you score?",
            options: [
              "High — the prose is good",
              "Mark down on structure and audience awareness, and note the strength on clarity of prose",
              "Neutral, style is subjective",
            ],
            correctIndex: 1,
            explanation:
              "Async writing is judged on whether a busy reader gets the decision fast. Split the criteria so both facts are recorded.",
          },
          {
            scenario:
              "A strong candidate writes in their second language with minor grammatical errors. What is the fair approach?",
            options: [
              "Score down for polish",
              "Score comprehension, structure and reasoning; ignore surface grammar unless the role requires publication-grade copy",
              "Ask for a rewrite",
            ],
            correctIndex: 1,
            explanation:
              "Grammar polish and communication effectiveness are different things. Conflating them screens out capable global candidates.",
          },
        ],
      },
      {
        slug: "async-3-timezone-fair-loops",
        title: "Time-zone fair loop design",
        focus:
          "Distribute the inconvenience of scheduling instead of loading it onto the candidate.",
        questions: [
          {
            scenario:
              "Every panel slot falls between 22:00 and 01:00 for the candidate. What does the loop measure?",
            options: [
              "Commitment",
              "Partly, their tolerance for sleep deprivation — a confound in every score that follows",
              "Nothing unusual for remote roles",
            ],
            correctIndex: 1,
            explanation:
              "Fatigue depresses performance on every competency. That is measurement error, not a signal about the candidate.",
          },
          {
            scenario:
              "What is the practical fix when overlap is genuinely tiny?",
            options: [
              "Rotate the inconvenience: some interviewers take out-of-hours slots, and use recorded async stages for the rest",
              "Only hire in nearby time zones",
              "Ask the candidate to take annual leave",
            ],
            correctIndex: 0,
            explanation:
              "Sharing the cost across the panel and shifting some stages async is what makes distributed hiring genuinely open.",
          },
          {
            scenario:
              "You use recorded video answers as a stage. What keeps it fair?",
            options: [
              "One take only, to see them under pressure",
              "Published questions, unlimited retakes within a time box, and blind rubric-based review",
              "Allowing the reviewer to watch at double speed to save time",
            ],
            correctIndex: 1,
            explanation:
              "One-take recordings measure camera comfort. Retakes within a box plus rubric review measure the competency you care about.",
          },
        ],
      },
      {
        slug: "async-4-remote-autonomy",
        title: "Remote autonomy & trust signals",
        focus:
          "Probe self-management, proactive escalation and working-in-the-open habits with real examples.",
        questions: [
          {
            scenario:
              "Which is the strongest evidence of remote autonomy?",
            options: [
              "'I am very self-motivated'",
              "'I noticed a blocker on day three, wrote it up in the shared doc, proposed two options and unblocked in a day'",
              "'I have worked remotely for six years'",
            ],
            correctIndex: 1,
            explanation:
              "Tenure and self-description are not behaviours. A specific escalation with a written trail is exactly the remote habit you need.",
          },
          {
            scenario:
              "A candidate says they prefer to figure everything out alone before sharing. What is the concern in a distributed team?",
            options: [
              "None, it shows independence",
              "Silent work is invisible work — probe how long they go dark and what triggers them to surface",
              "They should be rejected",
            ],
            correctIndex: 1,
            explanation:
              "Independence is good; unbounded silence is a distributed-team failure mode. The trigger for surfacing is the real signal.",
          },
          {
            scenario:
              "How should you assess a candidate with no prior remote experience?",
            options: [
              "Reject — remote experience is essential",
              "Probe the underlying behaviours: written updates, self-scoping, asking for help early, in any setting",
              "Assume it will be fine",
            ],
            correctIndex: 1,
            explanation:
              "The behaviours transfer even when the setting has not. Requiring the setting narrows your pool without improving prediction.",
          },
        ],
      },
    ],
  },
  {
    slug: "early-career-internal-mobility",
    title: "Early-Career & Internal Mobility Evaluation",
    category: "operational",
    audience: "Campus Recruiters, Mentors, Transfer Managers",
    summary:
      "Assess potential where there is no track record, and evaluate internal movers without office politics.",
    objectives: [
      "Measure learning velocity and potential with structured evidence.",
      "Run high-volume early-career loops that stay consistent.",
      "Evaluate internal transfers on evidence, not reputation.",
    ],
    artifact: "A potential-based scorecard plus a politics-free internal transfer record.",
    lessons: [
      {
        slug: "early-1-assessing-potential",
        title: "Assessing potential without a track record",
        focus:
          "Substitute learning velocity, curiosity and structured problem work for missing experience.",
        questions: [
          {
            scenario:
              "A graduate has no professional experience. What is the best evidence source?",
            options: [
              "University ranking and grade average",
              "A structured problem exercise plus a probe of something self-taught and how they learned it",
              "Extracurricular leadership titles",
            ],
            correctIndex: 1,
            explanation:
              "Institution prestige is a socioeconomic proxy. Learning velocity, demonstrated live, is a far better predictor for early-career roles.",
          },
          {
            scenario:
              "Two candidates present the same project. One had a mentor, one worked alone. How do you compare them?",
            options: [
              "Prefer the solo worker",
              "Ask each what they personally decided and what they would change, then score the reasoning",
              "Prefer the mentored one — coachability",
            ],
            correctIndex: 1,
            explanation:
              "Support levels differ by access, not ability. Contribution and reasoning are the comparable units.",
          },
          {
            scenario:
              "A candidate is visibly nervous and gives a weak first answer. What is the structured response?",
            options: [
              "Score the first answer and move on",
              "Give the same warm-up and second-chance framing you give every candidate, then score across the whole interview",
              "End the interview early to spare them",
            ],
            correctIndex: 1,
            explanation:
              "Early-career nerves add noise. A consistent warm-up protocol reduces it without giving anyone special treatment.",
          },
        ],
      },
      {
        slug: "early-2-volume-loops",
        title: "Structured campus loops at volume",
        focus:
          "Keep consistency across dozens of interviewers and hundreds of candidates.",
        questions: [
          {
            scenario:
              "Forty interviewers will run 400 interviews in two weeks. What matters most?",
            options: [
              "A fixed question set, a shared rubric and a short calibration session for every interviewer",
              "Assigning the most senior interviewers to the strongest candidates",
              "Letting interviewers choose questions to keep it fresh",
            ],
            correctIndex: 0,
            explanation:
              "At volume, variance between interviewers dominates variance between candidates unless the process is fixed and calibrated.",
          },
          {
            scenario:
              "Scores from one interviewer are consistently two points above everyone else. What is the action?",
            options: [
              "Nothing — some people are positive",
              "Normalise or recalibrate that interviewer, and review any borderline decisions they influenced",
              "Remove all their candidates",
            ],
            correctIndex: 1,
            explanation:
              "Systematic leniency is measurable and correctable. Left alone it decides who gets hired for reasons unrelated to the candidates.",
          },
          {
            scenario:
              "Late-day interviews score consistently lower. What is this?",
            options: [
              "Weaker candidates scheduled late",
              "Interviewer fatigue and contrast effects — cap daily interviews and randomise slot allocation",
              "A statistical artefact you can ignore",
            ],
            correctIndex: 1,
            explanation:
              "Slot-position effects are well documented. Capping load and randomising who gets which slot removes the systematic penalty.",
          },
        ],
      },
      {
        slug: "early-3-internal-transfers",
        title: "Internal transfer evaluation",
        focus:
          "Assess internal movers on role-relevant evidence rather than reputation and relationships.",
        questions: [
          {
            scenario:
              "An internal candidate is well liked by the panel. How do you protect the decision?",
            options: [
              "Trust the relationship — you know them best",
              "Run the same structured loop and rubric as external candidates, with at least one interviewer who does not know them",
              "Skip the interview entirely",
            ],
            correctIndex: 1,
            explanation:
              "Familiarity is affinity bias with a longer history. The same structure plus an unfamiliar interviewer keeps it honest.",
          },
          {
            scenario:
              "A strong performer in their current role scores poorly for the new one. What is the right message?",
            options: [
              "'You are not good enough'",
              "Specific, evidence-based feedback on the competencies the new role needs and what development would close the gap",
              "Nothing, to protect the relationship",
            ],
            correctIndex: 1,
            explanation:
              "Internal no-hires are a retention event. Evidence-based development feedback keeps a good employee engaged.",
          },
          {
            scenario:
              "The current manager blocks the transfer to keep the person. What is the governance answer?",
            options: [
              "Managers own their people",
              "Mobility policy should prevent hoarding — the decision belongs to the employee and the receiving role, within notice terms",
              "Let the two managers negotiate privately",
            ],
            correctIndex: 1,
            explanation:
              "Talent hoarding pushes good people out of the company entirely. A clear mobility policy removes it from personal negotiation.",
          },
        ],
      },
      {
        slug: "early-4-developmental-feedback",
        title: "Feedback that develops rather than rejects",
        focus:
          "Turn a no into usable development guidance without creating legal or reputational risk.",
        questions: [
          {
            scenario:
              "What makes early-career rejection feedback genuinely useful?",
            options: [
              "Two or three specific, evidence-based observations tied to the rubric and one concrete next step",
              "A warm note saying the field was very competitive",
              "A full breakdown of every interviewer's private comments",
            ],
            correctIndex: 0,
            explanation:
              "Specific and rubric-anchored is useful and defensible. Vague warmth teaches nothing; raw comments create risk.",
          },
          {
            scenario:
              "An interviewer wants to write 'not confident enough'. What is the correction?",
            options: [
              "It is honest, so keep it",
              "Rewrite as the observed behaviour: 'did not state a recommendation when asked to decide under time pressure'",
              "Delete the feedback entirely",
            ],
            correctIndex: 1,
            explanation:
              "Trait language is unactionable and bias-prone. Behavioural description is both fairer and more useful to the candidate.",
          },
          {
            scenario:
              "A rejected internal candidate asks for their scores. What do you share?",
            options: [
              "The full scorecard including interviewer names",
              "The competency-level outcomes and development guidance, without individual interviewer attribution",
              "Nothing",
            ],
            correctIndex: 1,
            explanation:
              "Competency-level transparency builds trust; attributing scores to named colleagues damages future candour in debriefs.",
          },
        ],
      },
    ],
  },
  {
    slug: "culture-add-alignment",
    title: "Cross-Functional & Culture-Add Alignment",
    category: "operational",
    audience: "Panelists, Culture Leads, Values Ambassadors",
    summary:
      "Replace culture fit with a scored, behavioural culture-add assessment that resists sameness.",
    objectives: [
      "Convert company values into observable interview behaviours.",
      "Run a culture-add slot that adds evidence rather than vibes.",
      "Detect and interrupt drift back towards culture fit.",
    ],
    artifact: "A values-to-behaviour matrix used by every culture-add interviewer.",
    lessons: [
      {
        slug: "culture-1-values-as-behaviours",
        title: "Values as behaviours, not vibes",
        focus:
          "Translate each company value into what it looks like when someone actually does it.",
        questions: [
          {
            scenario:
              "Your value is 'customer obsession'. What belongs in the rubric?",
            options: [
              "Whether the candidate says they love customers",
              "Observable behaviours: sought direct customer input, changed a decision because of it, measured the result",
              "Whether they have worked in a customer-facing role",
            ],
            correctIndex: 1,
            explanation:
              "Values become assessable only when written as behaviours with evidence. Otherwise the slot measures enthusiasm.",
          },
          {
            scenario:
              "An interviewer scores a candidate low on values with the note 'wouldn't grab a beer with them'. What happens?",
            options: [
              "It is honest team-fit input",
              "The score is invalid — it cites no behaviour against any value and should be excluded from the decision",
              "It should be averaged in with a lower weight",
            ],
            correctIndex: 1,
            explanation:
              "Social affinity is not a value. Excluding evidence-free scores is the only way the culture slot stays defensible.",
          },
          {
            scenario:
              "Two values conflict in a candidate's story — speed versus quality. How do you score?",
            options: [
              "Penalise them for inconsistency",
              "Score how consciously they navigated the tension and what they traded away",
              "Skip that value",
            ],
            correctIndex: 1,
            explanation:
              "Real values conflict in practice. Conscious navigation of the tension is the mature behaviour worth hiring for.",
          },
        ],
      },
      {
        slug: "culture-2-the-culture-add-slot",
        title: "Running the culture-add slot",
        focus:
          "Give the slot a defined competency set, a question bank and a scoring boundary.",
        questions: [
          {
            scenario:
              "What should the culture-add interviewer explicitly not do?",
            options: [
              "Ask behavioural questions about the values",
              "Re-assess technical skill or give an overall hire recommendation outside their scope",
              "Take notes",
            ],
            correctIndex: 1,
            explanation:
              "Scope creep turns the slot into a second opinion on everything, which duplicates evidence and dilutes accountability.",
          },
          {
            scenario:
              "What distinguishes culture add from culture fit in practice?",
            options: [
              "Add asks what perspective or capability the person brings that the team currently lacks",
              "Add is a friendlier word for the same thing",
              "Add means the candidate must be different in background",
            ],
            correctIndex: 0,
            explanation:
              "Add is a gap question about the team, not a similarity question about the candidate or a diversity quota.",
          },
          {
            scenario:
              "The culture interviewer is the only 'no' in a strong loop. What is correct?",
            options: [
              "Overrule them — they are not the functional expert",
              "Examine the specific behavioural evidence behind the no before deciding",
              "Automatically no-hire",
            ],
            correctIndex: 1,
            explanation:
              "A values no with concrete behavioural evidence is one of the most important signals a loop produces; without evidence it is noise.",
          },
        ],
      },
      {
        slug: "culture-3-conflict-scenarios",
        title: "Conflict & disagreement scenarios",
        focus:
          "Use disagreement scenarios to reveal how someone behaves when they are wrong or overruled.",
        questions: [
          {
            scenario:
              "Which question best reveals conflict behaviour?",
            options: [
              "'How do you handle conflict?'",
              "'Tell me about a time you were overruled on something you believed in — what did you do next?'",
              "'Do you avoid conflict?'",
            ],
            correctIndex: 1,
            explanation:
              "Behaviour after losing an argument is where commitment, sulking or sabotage actually shows up.",
          },
          {
            scenario:
              "A candidate says they have never had a workplace disagreement. How do you proceed?",
            options: [
              "Score it as excellent interpersonal skill",
              "Probe once more with a smaller-scale prompt, and if still absent record the evidence as missing",
              "Accept it and move on",
            ],
            correctIndex: 1,
            explanation:
              "Never having disagreed usually means low stakes or low candour. One re-probe, then record honestly, is the disciplined path.",
          },
          {
            scenario:
              "The candidate describes a conflict where the other person was entirely at fault. What is the probe?",
            options: [
              "'What would you do differently, and how did it look from their side?'",
              "'Were they eventually fired?'",
              "Nothing — some people are difficult",
            ],
            correctIndex: 0,
            explanation:
              "Perspective-taking and self-attribution are the competencies. A blameless narrative is a prompt for one more question, not a verdict.",
          },
        ],
      },
      {
        slug: "culture-4-guarding-against-drift",
        title: "Guarding against culture-fit drift",
        focus:
          "Audit the culture slot for sameness so it does not quietly become a similarity filter.",
        questions: [
          {
            scenario:
              "Your culture slot rejects candidates from non-traditional backgrounds at twice the rate. What do you do?",
            options: [
              "Assume the slot is working",
              "Audit the written evidence for trait language and social similarity, then retrain or redesign",
              "Remove the slot",
            ],
            correctIndex: 1,
            explanation:
              "Disparate outcomes are a prompt to inspect the evidence. Most drift shows up as trait words with no behaviour attached.",
          },
          {
            scenario:
              "Which review cadence keeps the slot honest?",
            options: [
              "A quarterly read of a sample of culture scorecards against the behaviour matrix",
              "An annual values refresh workshop",
              "Trusting experienced interviewers",
            ],
            correctIndex: 0,
            explanation:
              "Reading the actual written evidence regularly is the only mechanism that catches drift early.",
          },
          {
            scenario:
              "A team wants to add 'must love our office banter' to the matrix. What is your response?",
            options: [
              "Add it — culture matters",
              "Decline: it is a social similarity test with no link to performance and carries clear exclusion risk",
              "Add it with a lower weight",
            ],
            correctIndex: 1,
            explanation:
              "Anything not tied to job performance and observable behaviour does not belong in a values rubric.",
          },
        ],
      },
    ],
  },
];
