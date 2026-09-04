import type { ElectiveModule } from "./types";

export const complianceModules: ElectiveModule[] = [
  {
    slug: "global-employment-law",
    title: "Global Employment Law & Protected Questions",
    category: "compliance",
    audience: "Global Interviewers, International Recruiters",
    summary:
      "Stay inside the line on protected characteristics and know where the line moves by jurisdiction.",
    objectives: [
      "Recognise protected characteristics and the questions that touch them.",
      "Redirect an unlawful line of questioning to a lawful, job-related one.",
      "Know which rules vary by country and check before asking.",
    ],
    artifact: "A jurisdiction-aware question guardrail card for every interviewer.",
    lessons: [
      {
        slug: "law-1-protected-questions",
        title: "Protected characteristics & off-limits questions",
        focus:
          "Identify the questions that create legal exposure and replace them with job-related equivalents.",
        questions: [
          {
            scenario:
              "A candidate mentions young children. An interviewer wants to ask about childcare arrangements. What is the correct guidance?",
            options: [
              "It is fine as friendly small talk",
              "Do not ask; if availability matters, state the role's requirements and ask whether they can meet them",
              "Ask but do not write it down",
            ],
            correctIndex: 1,
            explanation:
              "Family-status questions are unlawful in most jurisdictions and predict nothing. Asking about the requirement is both lawful and more useful.",
          },
          {
            scenario:
              "Which of these is the lawful, job-related version?",
            options: [
              "'Where are you originally from?'",
              "'Are you legally able to work in this country, now or with sponsorship?'",
              "'What is your native language?'",
            ],
            correctIndex: 1,
            explanation:
              "Work authorisation is a legitimate requirement. Origin and native-language questions probe protected characteristics instead.",
          },
          {
            scenario:
              "A candidate volunteers information about a health condition. What should the interviewer do?",
            options: [
              "Ask follow-up questions about the prognosis",
              "Not probe; offer the standard adjustments process and return to job-related questions",
              "Note it in the scorecard as a risk",
            ],
            correctIndex: 1,
            explanation:
              "Volunteered information does not license enquiry, and recording it as a risk is direct evidence of discrimination.",
          },
        ],
      },
      {
        slug: "law-2-jurisdiction-differences",
        title: "Jurisdiction differences & disclosures",
        focus:
          "Know where salary history, criminal record and background-check rules differ, and default to the strictest.",
        questions: [
          {
            scenario:
              "You run one global loop. Salary history questions are banned in some of your markets. What is the safest policy?",
            options: [
              "Ask where it is legal",
              "Never ask anywhere; use expectations and internal bands instead",
              "Let each recruiter decide",
            ],
            correctIndex: 1,
            explanation:
              "A single strictest-jurisdiction standard is simpler to train, safer to operate and better for pay equity everywhere.",
          },
          {
            scenario:
              "A hiring manager wants a criminal record check before interview. What do you check first?",
            options: [
              "Nothing — it is standard diligence",
              "Local ban-the-box rules on timing, role-relevance requirements and the candidate's right to explain",
              "Only the vendor's price",
            ],
            correctIndex: 1,
            explanation:
              "Many jurisdictions restrict when checks may occur and require the offence to be relevant to the role, with a right of reply.",
          },
          {
            scenario:
              "Pay transparency rules require a posted range, but the manager wants to keep it flexible. What do you advise?",
            options: [
              "Post a very wide range to stay flexible",
              "Post the genuine band for the level; an implausibly wide range invites both complaints and candidate distrust",
              "Omit the range and handle it verbally",
            ],
            correctIndex: 1,
            explanation:
              "Token-compliance ranges are increasingly challenged by regulators and destroy candidate trust in the process.",
          },
        ],
      },
    ],
  },
  {
    slug: "cross-cultural-evaluation",
    title: "Cross-Cultural & Non-Native Candidate Evaluation",
    category: "compliance",
    audience: "Global Teams, Cross-Border Interviewers",
    summary:
      "Score capability, not cultural interview conventions or language polish.",
    objectives: [
      "Separate language fluency from job capability in scoring.",
      "Adjust for cultural norms around self-promotion, directness and hierarchy.",
      "Standardise accommodations that make loops fair across borders.",
    ],
    artifact: "A cross-cultural scoring guardrail appended to the interview rubric.",
    lessons: [
      {
        slug: "xcult-1-language-vs-capability",
        title: "Language fluency vs capability",
        focus:
          "Score only the level of language the job genuinely requires, and give processing space.",
        questions: [
          {
            scenario:
              "A candidate's technical reasoning is excellent but their spoken English is halting. The role is mostly written and code-based. How do you score?",
            options: [
              "Mark down on communication — it affects the team",
              "Score against the language demands the role actually has, and record the technical evidence at its true strength",
              "Reject to avoid future friction",
            ],
            correctIndex: 1,
            explanation:
              "Requiring more fluency than the job needs is an unjustified filter that removes strong global candidates for no performance gain.",
          },
          {
            scenario:
              "What practical adjustment improves accuracy with non-native speakers?",
            options: [
              "Speaking louder",
              "Sending questions in writing in advance, allowing extra thinking time and permitting written answers where the role allows",
              "Simplifying the technical content",
            ],
            correctIndex: 1,
            explanation:
              "These adjustments reduce language load without lowering the bar. Simplifying content lowers the bar and loses signal.",
          },
          {
            scenario:
              "An interviewer writes 'hard to understand' on the scorecard. What is the correction?",
            options: [
              "Accept it as honest feedback",
              "Require the specific job-related communication behaviour observed, or remove the comment as unscoreable",
              "Ask another interviewer to confirm",
            ],
            correctIndex: 1,
            explanation:
              "Accent-based impressions are a well-documented bias and, written that way, are legally exposed as well as unhelpful.",
          },
        ],
      },
      {
        slug: "xcult-2-cultural-norms",
        title: "Cultural communication norms in scoring",
        focus:
          "Prevent norms around self-promotion, eye contact and directness from being read as capability.",
        questions: [
          {
            scenario:
              "A candidate consistently says 'we' rather than 'I' because their culture discourages self-promotion. How do you get the evidence?",
            options: [
              "Score them low on ownership",
              "Ask directly: 'within that we, what was your specific decision and action?'",
              "Assume they contributed equally",
            ],
            correctIndex: 1,
            explanation:
              "The evidence is retrievable with one explicit question. Reading pronoun choice as a lack of ownership is a cultural misread.",
          },
          {
            scenario:
              "An interviewer notes 'poor eye contact, seemed evasive'. What is the issue?",
            options: [
              "It is a valid confidence observation",
              "Eye contact norms vary by culture and neurotype; the note measures conformity, not capability",
              "It should be weighted lower",
            ],
            correctIndex: 1,
            explanation:
              "Non-verbal conventions are among the least valid and most exclusionary things a panel can score.",
          },
          {
            scenario:
              "A candidate never challenges the interviewer, and the role requires pushing back on senior stakeholders. What is the fair assessment?",
            options: [
              "Conclude they cannot challenge authority",
              "Ask for a specific past example of disagreeing with a senior person, since interview deference may be a hierarchy norm",
              "Score neutral and move on",
            ],
            correctIndex: 1,
            explanation:
              "In-interview deference to an interviewer is a poor proxy. A behavioural example from their own context is the valid evidence.",
          },
        ],
      },
    ],
  },
];
