const parseBooleanFlag = (value) => {
  if (typeof value !== 'string') return false;
  return value.toLowerCase() === 'true';
};

const envEnabled = parseBooleanFlag(process.env.ENABLE_ADVANCED_ANALYSIS)
  || parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYSIS);

const ENABLE_ADVANCED_ANALYSIS = envEnabled;

function isAdvancedAnalysisEnabled() {
  return ENABLE_ADVANCED_ANALYSIS;
}

module.exports = {
  ENABLE_ADVANCED_ANALYSIS,
  isAdvancedAnalysisEnabled,
};
