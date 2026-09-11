import type { WeekQuestions } from "../types";

/** Q1 — Intake Calibration & Search Strategy (weeks 1-13) */
export const recruiterQ1: WeekQuestions = {
  1: [
    {
      scenario:
        "A VP of Engineering asks for 10+ years of React experience for a Senior Frontend role. What is the best response?",
      options: [
        "Source only profiles claiming 10+ years of React so the requirement is met",
        "Point out React was released in 2013 and redirect the bar to JavaScript depth, component architecture and modern state management",
        "Post the role as written and let the market decide",
      ],
      correctIndex: 1,
      explanation:
        "An impossible requirement is a signal, not an instruction. Reframing it as the underlying capability keeps the manager's intent and makes the search possible.",
    },
    {
      scenario:
        "During intake a hiring manager lists 18 must-have requirements. What is the most effective calibration move?",
      options: [
        "Accept all 18 and build one long search string joining them with AND",
        "Run a force-rank and trade-off exercise to isolate the top three non-negotiables from trainable and nice-to-have skills",
        "Quietly drop half of them to protect candidate volume",
      ],
      correctIndex: 1,
      explanation:
        "Force-ranking makes the trade-offs explicit and shared. Dropping requirements silently just moves the disagreement to shortlist review.",
    },
    {
      scenario:
        "A hiring manager says they will \"know the right person when they see them\". What should you do first?",
      options: [
        "Start sourcing on instinct and show five profiles to sharpen their taste",
        "Refuse to open the search until they write a detailed specification",
        "Agree a rubric with capability thresholds and concrete scenario outcomes before opening any channel",
      ],
      correctIndex: 2,
      explanation:
        "Intuition without criteria produces endless shortlist churn. A rubric turns taste into something you can search and screen against.",
    },
  ],
  2: [
    {
      scenario:
        "Which requirement belongs in the \"trainable\" column rather than \"non-negotiable\"?",
      options: [
        "Knowledge of the company's internal billing tool",
        "The ability to lead a team of eight engineers",
        "Regulated-industry experience for a compliance-critical role",
      ],
      correctIndex: 0,
      explanation:
        "Internal tooling is learned in weeks. Leadership scope and regulatory exposure take years and belong in the real bar.",
    },
    {
      scenario:
        "A manager insists on a degree requirement for a role where performance depends on hands-on skill. How do you handle it?",
      options: [
        "Keep it — it is an easy filter that saves screening time",
        "Show the shortlist impact of the filter and propose a work-sample check of the same underlying skill",
        "Remove it from the advert but keep filtering on it privately",
      ],
      correctIndex: 1,
      explanation:
        "Evidence about the filter's cost, plus a better way to test the same thing, changes minds. Filtering privately is the same bias with less transparency.",
    },
    {
      scenario:
        "What is the clearest sign your must-have list is still too long?",
      options: [
        "Sourcing returns a very small pool and the profiles that fit are all currently unavailable",
        "The hiring manager approved the list quickly",
        "The role has been open for less than a week",
      ],
      correctIndex: 0,
      explanation:
        "A pool that collapses to a handful of unavailable people is a requirements problem, not a sourcing problem.",
    },
  ],
  3: [
    {
      scenario: "What best indicates an intake meeting was successful?",
      options: [
        "The job advert was live on ten boards within the hour",
        "Recruiter and manager agree on three benchmark profiles, success measures and explicit trade-offs before sourcing starts",
        "The manager committed to reviewing CVs within two weeks",
      ],
      correctIndex: 1,
      explanation:
        "Shared benchmarks and agreed trade-offs are what make later shortlists predictable. Speed to advert is not alignment.",
    },
    {
      scenario:
        "A manager rejects your first five profiles with \"not quite right\". What is the strongest next step?",
      options: [
        "Send fifteen more profiles to widen the sample",
        "Ask them to rank the five against the agreed rubric and explain what specific evidence was missing",
        "Escalate to their director that the search is being blocked",
      ],
      correctIndex: 1,
      explanation:
        "Ranking against the rubric converts vague dislike into criteria you can search on, and recalibrates the bar with them rather than around them.",
    },
    {
      scenario: "Why agree benchmark profiles before outreach begins?",
      options: [
        "Because they make the advert easier to write",
        "Because they give both sides a concrete, comparable definition of the bar",
        "Because they let you skip the rubric",
      ],
      correctIndex: 1,
      explanation:
        "Real profiles anchor abstract criteria in something both sides can see and argue about early, before candidates are involved.",
    },
  ],
  4: [
    {
      scenario:
        "Your Boolean string returns thousands of loosely matching profiles. What is the most effective first fix?",
      options: [
        "Add NOT terms for the recurring irrelevant titles and require the core skill in the headline or current role",
        "Add more OR synonyms so nothing is missed",
        "Sort by connection degree and work down the list",
      ],
      correctIndex: 0,
      explanation:
        "Precision comes from excluding known noise and demanding the core skill in a high-signal field, not from widening the net further.",
    },
    {
      scenario: "What does the AND operator do to your result set?",
      options: [
        "Widens it by adding alternatives",
        "Narrows it by requiring every joined term to be present",
        "Ranks results by relevance",
      ],
      correctIndex: 1,
      explanation:
        "AND is a filter: every term must appear. Chaining many ANDs is the fastest way to shrink a pool to nothing.",
    },
    {
      scenario:
        "You are searching for a role whose title varies widely across companies. What should the string be built around?",
      options: [
        "The exact internal title used by your company",
        "Skills, tools and outcomes, with a broad OR group of common title variants",
        "Seniority keywords only",
      ],
      correctIndex: 1,
      explanation:
        "Titles are inconsistent between companies; capability terms are far more stable and surface people titles would hide.",
    },
  ],
  5: [
    {
      scenario:
        "A search engine offers semantic matching. What is its main advantage over strict Boolean?",
      options: [
        "It guarantees every result is qualified",
        "It surfaces related capabilities and phrasing you did not think to type",
        "It removes the need for a rubric",
      ],
      correctIndex: 1,
      explanation:
        "Semantic search widens recall around the concept. It still needs your criteria to judge who is actually qualified.",
    },
    {
      scenario:
        "You need someone who can own pricing analytics, but no one has that title. What do you search for?",
      options: [
        "Only people with the exact phrase \"pricing analytics\"",
        "Evidence of the underlying work: pricing models, margin analysis, elasticity, revenue reporting",
        "Anyone with the word analytics in their profile",
      ],
      correctIndex: 1,
      explanation:
        "Searching the work rather than the label finds the people already doing the job under a different name.",
    },
    {
      scenario: "What is the risk of skills-based search done carelessly?",
      options: [
        "Keyword-stuffed profiles rank highly without real depth",
        "It cannot be combined with Boolean operators",
        "It always returns fewer results than title search",
      ],
      correctIndex: 0,
      explanation:
        "Listed skills are claims. Depth still has to be confirmed with evidence of scope, outcomes and context.",
    },
  ],
  6: [
    {
      scenario:
        "You have 40 hours for a scarce, highly specialised role. Which approach fits best?",
      options: [
        "Mass outreach to 800 loosely matching profiles",
        "Deep research on 60 strong-fit people with individually tailored messages",
        "Reposting the advert across more job boards",
      ],
      correctIndex: 1,
      explanation:
        "For scarce roles, conversion beats volume. Tailored outreach to a well-researched pool wins where mass sends fail.",
    },
    {
      scenario: "When is a wide-net approach genuinely the right call?",
      options: [
        "For high-volume roles with a large, well-defined and available talent pool",
        "For confidential executive searches",
        "Whenever the hiring manager is impatient",
      ],
      correctIndex: 0,
      explanation:
        "Wide nets suit abundant markets. In scarce or sensitive markets they burn the pool and damage the brand.",
    },
    {
      scenario:
        "Your response rate on a precision campaign is 4%. What should you examine first?",
      options: [
        "The number of profiles contacted",
        "Message relevance and targeting: are you reaching the right people with a reason to care",
        "The company's careers page design",
      ],
      correctIndex: 1,
      explanation:
        "Low reply rates on a targeted campaign point at fit and message, not at volume.",
    },
  ],
  7: [
    {
      scenario: "What is the primary purpose of a talent market map?",
      options: [
        "To quantify where qualified people work, what they cost and how many are realistically reachable",
        "To create a list of companies to avoid",
        "To replace the intake meeting",
      ],
      correctIndex: 0,
      explanation:
        "A map turns opinion into numbers you can plan and negotiate with: supply, location, cost and reachability.",
    },
    {
      scenario:
        "Your map shows only 120 people in the region hold the required capability, and half are at one competitor. What should you tell the hiring manager?",
      options: [
        "Nothing yet — keep sourcing and hope",
        "Present the number and propose choices: widen the profile, widen the geography, or raise the package",
        "Recommend cancelling the search",
      ],
      correctIndex: 1,
      explanation:
        "Scarcity data is only useful when it is turned into explicit options for the decision-maker.",
    },
    {
      scenario: "Which source gives the most reliable market signal?",
      options: [
        "A single salary survey from two years ago",
        "Triangulated evidence: live market data, recent offer outcomes and candidate conversations",
        "The hiring manager's estimate",
      ],
      correctIndex: 1,
      explanation:
        "One stale source is easy to dismiss. Triangulated evidence is much harder to argue with and far closer to reality.",
    },
  ],
  8: [
    {
      scenario:
        "The approved range sits well below the market median for the capability required. What is the best first action?",
      options: [
        "Start the search and negotiate hard later",
        "Bring evidence of the gap to the manager and finance, with the trade-offs of holding the range",
        "Hide the range from candidates for as long as possible",
      ],
      correctIndex: 1,
      explanation:
        "A pay gap is a decision to be made up front. Hiding it just moves the failure to offer stage, after everyone has spent weeks.",
    },
    {
      scenario: "When should compensation expectations be discussed with a candidate?",
      options: [
        "In the first conversation, with a clear range",
        "Only once they reach final interview",
        "Only after the offer is drafted",
      ],
      correctIndex: 0,
      explanation:
        "Early range clarity prevents late-stage collapse and respects the candidate's time as much as your own.",
    },
    {
      scenario:
        "A candidate quotes a number 25% above range but is otherwise the strongest fit. What do you do?",
      options: [
        "End the conversation immediately",
        "Explore the whole package, understand what is driving the number, and check flexibility before going further",
        "Promise to match it and sort it out later",
      ],
      correctIndex: 1,
      explanation:
        "Understanding what sits behind the number often reveals room to move; promising what you cannot deliver destroys trust.",
    },
  ],
  9: [
    {
      scenario:
        "For a scarce role, what should scarcity change first?",
      options: [
        "Only the volume of outreach",
        "The process design: fewer stages, faster feedback and a stronger sell",
        "Nothing — the standard process should apply to every role",
      ],
      correctIndex: 1,
      explanation:
        "Scarce candidates leave slow processes. Speed and a compelling pitch matter more than sending more messages.",
    },
    {
      scenario:
        "A manager wants a five-stage loop for a role with 30 available candidates nationally. Your response?",
      options: [
        "Run the loop as designed and manage the drop-off",
        "Show the expected drop-off at each stage against the pool size and propose a compressed loop",
        "Reduce the bar so more people pass",
      ],
      correctIndex: 1,
      explanation:
        "Modelling the funnel against the real pool shows why the loop must change, without lowering the standard.",
    },
    {
      scenario: "What is a realistic pipeline commitment for a scarce role?",
      options: [
        "A promised number of CVs per week regardless of market",
        "An agreed shortlist target based on the mapped pool, with a review point if reality diverges",
        "Whatever the manager asks for",
      ],
      correctIndex: 1,
      explanation:
        "Commitments grounded in the map keep credibility; volume promises in a thin market always break.",
    },
  ],
  10: [
    {
      scenario:
        "A CV says \"led digital transformation across the organisation\". What is the highest-signal follow-up?",
      options: [
        "\"That sounds impressive — what tools did you use?\"",
        "\"Walk me through what you personally owned, who else was involved and what measurably changed.\"",
        "\"Do you consider yourself a transformation expert?\"",
      ],
      correctIndex: 1,
      explanation:
        "Ownership, context and measurable outcome are what separate a real programme from a buzzword.",
    },
    {
      scenario: "Which is genuine screening signal rather than noise?",
      options: [
        "A specific outcome with a number and a timeframe the candidate can explain",
        "A long list of technologies in a skills section",
        "A well-known former employer",
      ],
      correctIndex: 0,
      explanation:
        "Explained, quantified outcomes are hard to fake. Skill lists and brand names are cheap to acquire.",
    },
    {
      scenario: "Why use the same core screening questions for every candidate on a role?",
      options: [
        "It makes the calls faster",
        "It produces comparable evidence so the shortlist decision is defensible",
        "It removes the need to take notes",
      ],
      correctIndex: 1,
      explanation:
        "Comparability is the point of structure — it is what lets you rank candidates on evidence rather than impression.",
    },
  ],
  11: [
    {
      scenario:
        "A candidate has four roles in five years, each with growing scope. How should you read it?",
      options: [
        "Reject — the tenure is too short",
        "Treat progression in scope as the signal and ask about the reasons behind each move",
        "Ignore the pattern entirely",
      ],
      correctIndex: 1,
      explanation:
        "Growing scope suggests demand and capability. The reasons for each move are the evidence you need, not the dates.",
    },
    {
      scenario: "Which resume pattern most deserves a closer look?",
      options: [
        "Twelve years at one company with no change in responsibility for a role requiring rapid change",
        "A career break clearly explained",
        "A move from a large company to a startup",
      ],
      correctIndex: 0,
      explanation:
        "Static scope over a long period is worth probing against a change-heavy role — not disqualifying, but worth evidence.",
    },
    {
      scenario:
        "You cannot tell from the CV whether the candidate built or merely used a system. What do you do?",
      options: [
        "Assume they built it, given the seniority",
        "Ask in the screen exactly what they designed, decided and delivered",
        "Reject to save time",
      ],
      correctIndex: 1,
      explanation:
        "Build versus use is a huge difference in capability, and a single direct question settles it.",
    },
  ],
  12: [
    {
      scenario: "What belongs in a well-designed 20-minute phone screen?",
      options: [
        "Two probed capability examples, motivation, logistics and a clear next step",
        "A full technical assessment",
        "An unstructured conversation to see if there is chemistry",
      ],
      correctIndex: 0,
      explanation:
        "A screen should collect a small amount of comparable, high-value evidence and sell the role — not replace the interview loop.",
    },
    {
      scenario: "How should screen notes be recorded?",
      options: [
        "As a summary impression written later that day",
        "As evidence against each criterion, captured during or immediately after the call",
        "Only if the candidate progresses",
      ],
      correctIndex: 1,
      explanation:
        "Evidence written against criteria in the moment is what survives a debrief; recalled impressions drift.",
    },
    {
      scenario: "You are running behind and have five minutes left. What do you protect?",
      options: [
        "The company history section",
        "The core capability probe and a clear next step for the candidate",
        "The salary conversation, which can wait until later stages",
      ],
      correctIndex: 1,
      explanation:
        "Evidence and a clean close are the two things a screen must deliver; background can be sent in writing.",
    },
  ],
  13: [
    {
      scenario:
        "Reviewing a completed search front-to-back, which failure most often traces back to intake?",
      options: [
        "The manager rejecting a strong shortlist as \"not what I meant\"",
        "A candidate withdrawing for personal reasons",
        "A scheduling clash in the final week",
      ],
      correctIndex: 0,
      explanation:
        "Shortlist rejection is almost always an alignment failure created at intake, not a sourcing failure.",
    },
    {
      scenario: "You have shortlisted four candidates. What makes the shortlist defensible?",
      options: [
        "Each candidate is mapped to the agreed criteria with recorded evidence and clear trade-offs",
        "All four came from competitor companies",
        "They were the first four to reply",
      ],
      correctIndex: 0,
      explanation:
        "A defensible shortlist shows how each person meets the agreed bar, so the conversation is about trade-offs, not taste.",
    },
    {
      scenario:
        "Which single habit most improves the front end of a search over a quarter?",
      options: [
        "Sending more outreach every week",
        "Closing each search with a short review of where the funnel actually leaked",
        "Using more job boards",
      ],
      correctIndex: 1,
      explanation:
        "A short structured retrospective is what turns one search's lessons into the next search's speed.",
    },
  ],
};
