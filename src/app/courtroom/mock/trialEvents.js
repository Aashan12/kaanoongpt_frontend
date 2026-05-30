const LAWS = [
  {
    title: 'मुलुकी देवानी संहिता',
    citation_label: 'देवानी संहिता दफा ९४',
    relevance_label: 'सम्बन्ध विच्छेद निवेदन',
    verified: true,
  },
  {
    title: 'मुलुकी देवानी संहिता',
    citation_label: 'देवानी संहिता दफा ९७',
    relevance_label: 'भरणपोषण र राहत',
    verified: true,
  },
  {
    title: 'मुलुकी देवानी संहिता',
    citation_label: 'देवानी संहिता दफा १००',
    relevance_label: 'बाल संरक्षकत्व',
    verified: true,
  },
];

const STEPS = {
  plaintiffReview: ['Read petition', 'Identify parties', 'Map claims'],
  defendantReview: ['Read response', 'Identify defenses', 'Check alignment'],
  statement: ['Read facts', 'Frame argument', 'Draft statement'],
  judge: ['Review arguments', 'Weigh evidence', 'Set questions'],
};

function agentStart(pipeline, agentName, phase, round, thinkingSteps) {
  return { type: 'sub_agent_start', pipeline, agent_name: agentName, phase, round, thinking_steps: thinkingSteps };
}

function agentComplete(pipeline, agentName, phase, round, outputSummary, durationMs = 900, thinkingResults = []) {
  return { type: 'sub_agent_complete', pipeline, agent_name: agentName, phase, round, output_summary: outputSummary, duration_ms: durationMs, thinking_results: thinkingResults };
}

function openingPlaintiff() {
  return `माननीय अदालत, फिरादी सीता श्रेष्ठको तर्फबाट प्रारम्भिक बहस प्रस्तुत गर्दछु। फिरादपत्रमा उल्लेख भएअनुसार प्रतिवादी आशान नगरकोटीले वैवाहिक सम्बन्धपछि परिवारप्रतिको आर्थिक जिम्मेवारी बेवास्ता गरेको, मदिरा सेवनपछि कुटपिट गरेको र मानसिक यातना दिएको दाबी गरिएको छ।

फिरादी पक्षको मुख्य माग सम्बन्ध विच्छेद, उचित भरणपोषण, सन्तानको सर्वोत्तम हितअनुसार संरक्षकत्व र कागजातमा उल्लेखित राहतसँग सम्बन्धित छ। स्वास्थ्य प्रतिवेदन, विवाह दर्ता प्रमाणपत्र, साक्षी बयान र आर्थिक अवस्थासम्बन्धी कागजातहरू प्रमाणका रूपमा परीक्षण हुनुपर्ने देखिन्छ।

अदालतसमक्ष हाम्रो निवेदन छ कि यस विवादलाई असम्बन्धित करार वा व्यापारिक क्षतिपूर्तिको भाषामा नभई परिवार कानून, प्रमाणको विश्वसनीयता र बाल हितको दृष्टिले मूल्याङ्कन गरियोस्।`;
}

function openingDefendant() {
  return `माननीय अदालत, प्रतिवादी आशान नगरकोटीको तर्फबाट फिरादीका आरोपहरू पूर्ण रूपमा स्वीकार गर्न नसकिने निवेदन गर्दछु। प्रतिवादीले वैवाहिक सम्बन्ध बिग्रिएको तथ्यलाई अस्वीकार गरेका छैनन्, तर हिंसा, आर्थिक बेवास्ता र मानसिक यातनाका आरोपहरू प्रमाणबाट पुष्टि हुनुपर्ने विषय हुन्।

प्रतिउत्तरपत्रमा फिरादी आर्थिक रूपमा सक्षम रहेको, प्रतिवादीले घरखर्चमा योगदान गर्दै आएको र वैवाहिक सम्बन्ध बिग्रनुमा फिरादीको विवाहबाह्य सम्बन्धसम्बन्धी जिकिर पनि रहेको उल्लेख छ। त्यस्ता प्रतिरक्षाहरूलाई कल विवरण, सन्देश, साक्षी र आर्थिक अभिलेखसँग जोडेर अदालतले परीक्षण गर्नुपर्नेछ।

त्यसैले प्रतिवादी पक्ष भरणपोषण र संरक्षकत्वसम्बन्धी मागहरू प्रमाण र बाल हितका आधारमा मात्र निर्धारण हुनुपर्ने निवेदन गर्दछ।`;
}

function counterPlaintiff(round) {
  return `माननीय अदालत, चरण ${round} मा प्रतिवादी पक्षले आरोप अस्वीकार गरे पनि फिरादीले पेश गरेका स्वास्थ्य प्रतिवेदन, साक्षी र वैवाहिक अवस्थासम्बन्धी कागजातलाई सामान्य इन्कारीले कमजोर बनाउन सक्दैन। प्रतिवादीको विवाहबाह्य सम्बन्धसम्बन्धी प्रतिआरोप प्रमाण परीक्षणबाट मात्र स्थापित हुन सक्छ।

फिरादी पक्षको जोड यो हो कि आर्थिक योगदान, हिंसात्मक व्यवहार र सन्तानको हितलाई अलग-अलग होइन, वैवाहिक सम्बन्धको समग्र अवस्थाको रूपमा अदालतले हेर्नुपर्छ। भरणपोषण र संरक्षकत्वसम्बन्धी आदेश प्रमाण, आवश्यकता र बालबालिकाको स्थिर वातावरणका आधारमा गरिनुपर्छ।`;
}

function counterDefendant(round) {
  return `माननीय अदालत, चरण ${round} मा प्रतिवादी पक्ष पुनः स्पष्ट गर्दछ कि फिरादीका दाबीहरू प्रमाणबाट मात्र स्वीकार्य हुन सक्छन्। स्वास्थ्य प्रतिवेदन वा साक्षी बयान प्रस्तुत हुनु मात्र पर्याप्त हुँदैन; ती कागजातहरू घटना, समय र प्रतिवादीसँग प्रत्यक्ष रूपमा जोडिनुपर्छ।

प्रतिवादीले सम्बन्ध विच्छेदको अवस्थालाई व्यावहारिक रूपमा स्वीकार गरे पनि भरणपोषण, दोष र संरक्षकत्वका विषयमा अदालतले दुवै पक्षको आर्थिक अवस्था, आचरण, प्रमाणको विश्वसनीयता र सन्तानको सर्वोत्तम हित हेर्नुपर्ने निवेदन गर्दछ।`;
}

function counterPlaintiffRebuttal() {
  return `माननीय अदालत, प्रतिवादी पक्षले प्रमाणको कठोर परीक्षणको कुरा उठाए पनि फिरादी पक्षको निवेदन के छ भने घटनाहरूलाई छुट्टाछुट्टै होइन, वैवाहिक सम्बन्धभित्र निरन्तर देखिएको व्यवहारको रूपमा हेर्नुपर्छ। आर्थिक बेवास्ता, मदिरा सेवनपछि भएको हिंसा र मानसिक यातनाका दाबीहरूलाई साक्षी, स्वास्थ्य विवरण र घरायसी परिस्थितिसँग जोडेर मूल्याङ्कन गरिनुपर्छ।

फिरादी पक्षले प्रतिवादीको विवाहबाह्य सम्बन्धसम्बन्धी प्रतिआरोपलाई मुख्य मुद्दाबाट ध्यान हटाउने प्रयासका रूपमा लिएको छ। त्यसैले अदालतले सम्बन्ध विच्छेद, भरणपोषण र बाल हितसम्बन्धी राहतलाई प्रमाणको समग्र प्रभावका आधारमा हेर्न अनुरोध गर्दछ।`;
}

function counterDefendantRebuttal() {
  return `माननीय अदालत, फिरादी पक्षले घटनाहरूलाई समग्र रूपमा हेर्न आग्रह गरे पनि प्रतिवादी पक्षको निवेदन के छ भने प्रत्येक दाबीको कानूनी र प्रमाणिक आधार अलग-अलग जाँचिनुपर्छ। सामान्य आरोप वा पारिवारिक असहमति मात्रबाट हिंसा, आर्थिक बेवास्ता वा संरक्षकत्वको अधिकार स्वतः स्थापित हुँदैन।

प्रतिवादी पक्षले फिरादीको आर्थिक अवस्था, प्रस्तुत कागजातको विश्वसनीयता र सन्तानको स्थिर वातावरणलाई समान रूपमा विचार गर्न अदालतसमक्ष अनुरोध गर्दछ। भरणपोषण वा संरक्षकत्वसम्बन्धी कुनै पनि आदेश प्रमाणित आवश्यकता र बाल हितमा मात्र आधारित हुनुपर्छ।`;
}

function closingPlaintiff() {
  return `माननीय अदालत, अन्तिम बहसमा फिरादी पक्षले वैवाहिक सम्बन्ध गम्भीर रूपमा बिग्रिएको, प्रतिवादीबाट आर्थिक बेवास्ता र हिंसात्मक व्यवहार भएको तथा सन्तानको स्थिर वातावरणका लागि फिरादीको संरक्षकत्व उचित हुने निवेदन गर्दछ।

अदालतले फिरादपत्र, स्वास्थ्य प्रतिवेदन, विवाह दर्ता, साक्षी र आर्थिक प्रमाणलाई एकसाथ मूल्याङ्कन गरी सम्बन्ध विच्छेद, भरणपोषण र बाल हितसम्बन्धी न्यायोचित आदेश जारी गरिदिन अनुरोध गर्दछ।`;
}

function closingDefendant() {
  return `माननीय अदालत, प्रतिवादी पक्षको अन्तिम निवेदन के छ भने सम्बन्ध विच्छेदको अवस्था देखिए पनि फिरादीका आरोपहरू स्वतः प्रमाणित हुँदैनन्। हिंसा, बेवास्ता, भरणपोषण र संरक्षकत्वका प्रत्येक मागलाई प्रमाण र कानूनसँग जोडेर मात्र आदेश हुनुपर्छ।

प्रतिवादीले फिरादीको आर्थिक क्षमता, वैकल्पिक प्रतिरक्षा र सन्तानलाई स्थिर वातावरण दिन सक्ने अवस्थालाई अदालतले ध्यानमा राखी असन्तुलित राहत नदिन अनुरोध गर्दछ।`;
}

function judgeEvaluation(round) {
  return `अदालतले चरण ${round} का बहस सुनेको छ। मुख्य विवाद सम्बन्ध विच्छेद, भरणपोषण, हिंसा/यातना, विवाहबाह्य सम्बन्धको प्रतिरक्षा र सन्तानको सर्वोत्तम हितमा केन्द्रित छ।

फिरादी पक्षले दाबी प्रमाणित गर्न कागजात, साक्षी र प्रतिवेदनसँग आफ्नो बहस जोड्नुपर्नेछ। प्रतिवादी पक्षले अस्वीकार र प्रतिरक्षालाई ठोस प्रमाणसँग जोड्नुपर्नेछ। अर्को चरणमा दुवै पक्षले प्रमाणको विश्वसनीयता र राहतको कानूनी आधारमा बहस केन्द्रित गर्नेछन्।`;
}

function judgeClosingTransition() {
  return `अदालतले दुवै पक्षका प्रतिवाद र प्रत्युत्तर सुनेको छ। अब मुख्य प्रश्नहरू सम्बन्ध विच्छेद, भरणपोषण, प्रमाणको विश्वसनीयता र सन्तानको सर्वोत्तम हितमा सीमित भएका छन्।

यसपछि दुवै पक्षले आफ्नो अन्तिम बहस प्रस्तुत गर्नेछन्। अन्तिम बहसमा नयाँ विवाद विस्तार नगरी, पेश भएका कागजात, प्रमाण र कानूनी आधारमा मात्र निष्कर्ष केन्द्रित गरियोस्।`;
}

function verdict() {
  return `माननीय अदालत, प्रस्तुत सुनुवाइ शैक्षिक सिमुलेशनका रूपमा गरिएको हो। दुवै पक्षका कागजात र बहस हेर्दा वैवाहिक सम्बन्ध गम्भीर रूपमा बिग्रिएको देखिन्छ।

फिरादी पक्षले घरेलु हिंसा, मानसिक यातना, आर्थिक बेवास्ता र भरणपोषणको दाबी उठाएको छ। प्रतिवादी पक्षले आरोप अस्वीकार गर्दै विवाहबाह्य सम्बन्ध, आर्थिक क्षमता र संरक्षकत्वसम्बन्धी प्रतिरक्षा प्रस्तुत गरेको छ।

अदालतको अन्तरिम निष्कर्षमा सम्बन्ध विच्छेद, भरणपोषण, प्रमाणको विश्वसनीयता र सन्तानको सर्वोत्तम हित विस्तृत प्रमाण परीक्षणपछि मात्र अन्तिम रूपमा ठहर गर्न सकिने देखिन्छ। यस सिमुलेशनमा कुनै पक्षलाई पूर्ण विजेता घोषणा नगरी प्रमाणमा आधारित मूल्याङ्कन आवश्यक रहेको निष्कर्ष दिइन्छ।

विजेता: अनिश्चित`;
}

export function buildMockTrialEvents() {
  const counterRound = 1;
  const plaintiffReviewResults = [
    'Petition read:\nDocument: फिरादपत्र\nStatus: Text extracted',
    'Parties identified:\nPlaintiff: २८ वर्ष पुगेकी सीता श्रेष्ठ\nDefendant: ३० वर्ष पुगेका आशान नगरकोटी\nRelated issue: बाल संरक्षण',
    'Claims mapped:\nCase type: सम्बन्ध विच्छेद\nPrimary relief: भरणपोषण\nIssues: घरेलु हिंसा/कुटपिट, आर्थिक बेवास्ता, मानसिक यातना, मदिरा सेवन',
  ];
  const defendantReviewResults = [
    'Response read:\nDocument: प्रतिउत्तरपत्र\nStatus: Text extracted',
    'Defenses identified:\nPosition: आंशिक स्वीकृति\nDenial: आरोप अस्वीकार\nCounterclaim: परपुरुष गमनको प्रतिआरोप',
    'Alignment checked:\nMatched parties: २८ वर्ष पुगेकी सीता श्रेष्ठ, ३० वर्ष पुगेका आशान नगरकोटी\nCase type: सम्बन्ध विच्छेद\nResult: Petition and response refer to the same civil dispute',
  ];

  const events = [
    { type: 'trial_started', num_rounds: counterRound, language: 'ne' },
    { type: 'phase_start', phase: 'document_review', content: 'Reviewing uploaded petition and response...' },
    agentStart('plaintiff', 'Plaintiff Case Reviewer', 'document_review', 0, STEPS.plaintiffReview),
    agentComplete('plaintiff', 'Plaintiff Case Reviewer', 'document_review', 0, 'Parties and plaintiff claims extracted.', 650, plaintiffReviewResults),
    agentStart('defendant', 'Defendant Case Reviewer', 'document_review', 0, STEPS.defendantReview),
    agentComplete('defendant', 'Defendant Case Reviewer', 'document_review', 0, 'Response and defenses matched to the petition.', 720, defendantReviewResults),
    {
      type: 'case_analysis',
      matched: true,
      case_type: 'सम्बन्ध विच्छेद',
      parties_matched: true,
      case_type_matched: true,
      shared_parties: ['सीता श्रेष्ठ', 'आशान नगरकोटी'],
      issues: ['सम्बन्ध विच्छेद', 'भरणपोषण', 'बाल हित', 'हिंसा/यातना', 'विवाहबाह्य सम्बन्धको जिकिर'],
      reason: 'फिरादपत्र र प्रतिउत्तरपत्र एउटै नागरिक मुद्दासँग सम्बन्धित देखिन्छन्।',
    },
    { type: 'phase_start', phase: 'research', content: 'Legal research started.' },
    {
      type: 'research_complete',
      phase: 'research',
      laws_count: LAWS.length,
      cases_count: 0,
      laws: LAWS,
      cases: [],
    },
    { type: 'phase_start', phase: 'opening_statements', content: 'Opening statements started.' },
    agentStart('plaintiff', 'Statement Prep', 'opening_statements', 0, STEPS.statement),
    agentComplete('plaintiff', 'Statement Prep', 'opening_statements', 0, 'Opening statement drafted.', 1800),
    { type: 'argument', agent: 'plaintiff', phase: 'opening_statements', round: 0, content: openingPlaintiff() },
    agentStart('defendant', 'Statement Prep', 'opening_statements', 0, STEPS.statement),
    agentComplete('defendant', 'Statement Prep', 'opening_statements', 0, 'Defense opening statement drafted.', 1700),
    { type: 'argument', agent: 'defendant', phase: 'opening_statements', round: 0, content: openingDefendant() },
  ];

  events.push(
    { type: 'phase_start', phase: 'argument_rounds', round: counterRound, content: `Counter arguments round ${counterRound}.` },
    agentStart('plaintiff', 'Statement Prep', 'argument_rounds', counterRound, STEPS.statement),
    agentComplete('plaintiff', 'Statement Prep', 'argument_rounds', counterRound, 'Plaintiff counter argument drafted.', 1550),
    { type: 'argument', agent: 'plaintiff', phase: 'argument_rounds', round: counterRound, content: counterPlaintiff(counterRound) },
    agentStart('defendant', 'Statement Prep', 'argument_rounds', counterRound, STEPS.statement),
    agentComplete('defendant', 'Statement Prep', 'argument_rounds', counterRound, 'Defendant counter argument drafted.', 1500),
    { type: 'argument', agent: 'defendant', phase: 'argument_rounds', round: counterRound, content: counterDefendant(counterRound) },
    agentStart('plaintiff', 'Statement Prep', 'argument_rounds', counterRound, STEPS.statement),
    agentComplete('plaintiff', 'Statement Prep', 'argument_rounds', counterRound, 'Plaintiff rebuttal drafted.', 1450),
    { type: 'argument', agent: 'plaintiff', phase: 'argument_rounds', round: counterRound, content: counterPlaintiffRebuttal() },
    agentStart('defendant', 'Statement Prep', 'argument_rounds', counterRound, STEPS.statement),
    agentComplete('defendant', 'Statement Prep', 'argument_rounds', counterRound, 'Defendant rebuttal drafted.', 1450),
    { type: 'argument', agent: 'defendant', phase: 'argument_rounds', round: counterRound, content: counterDefendantRebuttal() },
    agentStart('judge', 'Legal Analysis', 'argument_rounds', counterRound, STEPS.judge),
    agentComplete('judge', 'Legal Analysis', 'argument_rounds', counterRound, 'Judge moved the hearing to closing statements.', 1200),
    { type: 'evaluation', agent: 'judge', phase: 'argument_rounds', round: counterRound, content: judgeClosingTransition() },
  );

  events.push(
    { type: 'phase_start', phase: 'closing_statements', content: 'Closing statements started.' },
    agentStart('plaintiff', 'Statement Prep', 'closing_statements', 0, STEPS.statement),
    agentComplete('plaintiff', 'Statement Prep', 'closing_statements', 0, 'Plaintiff closing statement drafted.', 1400),
    { type: 'argument', agent: 'plaintiff', phase: 'closing_statements', round: 0, content: closingPlaintiff() },
    agentStart('defendant', 'Statement Prep', 'closing_statements', 0, STEPS.statement),
    agentComplete('defendant', 'Statement Prep', 'closing_statements', 0, 'Defendant closing statement drafted.', 1420),
    { type: 'argument', agent: 'defendant', phase: 'closing_statements', round: 0, content: closingDefendant() },
    { type: 'phase_start', phase: 'verdict', content: 'Verdict drafting started.' },
    agentStart('judge', 'Verdict Agent', 'verdict', 0, STEPS.judge),
    agentComplete('judge', 'Verdict Agent', 'verdict', 0, 'Final simulated verdict drafted.', 1600),
    { type: 'verdict', agent: 'judge', phase: 'verdict', round: 0, content: verdict(), winner: 'unknown' },
    { type: 'trial_complete', phase: 'complete', content: 'Trial concluded.' },
  );

  return events;
}
