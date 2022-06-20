var Types = {
  OnlyTwoInputs: {
    id: "OnlyTwoInputs",
    score: 0.3
  },
  RandomIdentifiers: {
    id: "RandomIdentifiers",
    score: -0.1
  },
  ManyTextInputs: {
    id: "ManyTextInputs",
    score: -0.1
  },
  ResolvedToTwoInputs: {
    id: "ManyTextInputs",
    score: -0.1
  },
  HelpingId: {
    id: "HelpingId",
    score: 0.5
  },
  HelpingName: {
    id: "HelpingName",
    score: 0.5
  },
  HelpingClass: {
    id: "HelpingClass",
    score: 0.2
  },
  HelpingDataAttr: {
    id: "HelpingDataAttr",
    score: 0.2
  },
  HelpingMaxLengthForPnr: {
    id: "HelpingMaxLengthForPnr",
    score: 0.2
  },
  LabelMatches: {
    id: "LabelMatches",
    score: 0.5
  },
  ViewPortNearBy: {
    id: "ViewPortNearBy",
    score: 0.5
  },
  GivingUp: {
    id: "GivingUp",
    score: -1.0,
    message: "Unknown",
    context: undefined
  }
};

export { Types };
