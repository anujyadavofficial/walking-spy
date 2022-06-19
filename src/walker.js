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

var Context = {
  states: {},
  candidates: [],
  textWrappers: [],
  reasons: [],
  pnrContext: { texts: ["pnr", "ticket", "number"], type: "Pnr" },
  nameContext: { texts: ["email", "last", "name"], type: "Name" },
  similar: function (texts, str) {
    var present = false;
    Array.from(texts).forEach(function (text) {
      if (text.indexOf(str)) {
        present = true;
      }
    });
    return present;
  },
  verify: function (attr, matchFor, wrapper, state) {
    var matchKey = matchFor.startsWith("data")
      ? matchFor.replace(/-/g, "_") + "Match"
      : matchFor + "Match";

    if (this.similar(this.pnrContext.texts, attr.value)) {
      if (wrapper.forName) {
        wrapper.cannotSay = true;
      }
      wrapper[matchKey] = true;
      wrapper.forPnr = true;
      wrapper.states.push(state);
    } else if (this.similar(this.nameContext.texts, attr.value)) {
      if (wrapper.forPnr) {
        wrapper.cannotSay = true;
      }

      wrapper[matchKey] = true;
      wrapper.forName = true;
      wrapper.states.push(state);
    }
    return wrapper;
  },
  isTextInput: function (element) {}
};

var Spy = {
  candidates: [],
  textInputs: [],
  hasGivenUp: function () {
    return Context.reasons.length > 0;
  },
  pnrGuard: function (wrapper) {
    return !this.hasGivenUp() && !wrapper.forName && !wrapper.cannotSay;
  },
  nameGuard: function (wrapper) {
    return !this.hasGivenUp() && !wrapper.forPnr && !wrapper.cannotSay;
  },
  giveUp: function (message, wrapper) {
    if (wrapper) {
      wrapper.cannotSay = true;
    }
    var giveUpData = Types.GivingUp;
    giveUpData.message = message;
    giveUpData.wrapper = wrapper;

    Context.reasons.push(giveUpData);

    throw "Giving Up";
  },
  similar: function (texts, str) {
    var present = false;
    Array.from(texts).forEach(function (text) {
      if (text.indexOf(str)) {
        present = true;
      }
    });
    return present;
  },
  verify: function (attr, matchFor, wrapper, state) {
    var matchKey = matchFor.startsWith("data")
      ? matchFor.replace(/-/g, "_") + "Match"
      : matchFor + "Match";

    if (this.similar(this.pnrContext.texts, attr.value)) {
      if (this.pnrGuard(wrapper)) {
        wrapper[matchKey] = true;
        wrapper.forPnr = true;
        wrapper.states.push(state);
      }
      this.giveUp("Ambiguous classification.", wrapper);
    } else if (this.similar(this.nameContext.texts, attr.value)) {
      if (this.nameGuard(wrapper)) {
        wrapper[matchKey] = true;
        wrapper.forName = true;
        wrapper.states.push(state);
      }
      this.giveUp("Ambiguous classification.", wrapper);
    }
    return wrapper;
  },
  findCandidates: function () {
    Context.candidates = document.body.getElementsByTagName("input");
    if (!Context.candidates || Context.candidates.length === 0) {
      this.giveUp("Failed to find candidates");
    }

    Array.from(Context.candidates).forEach(function (input, index) {
      var attributes = input.getAttributeNames();
      console.log(attributes);

      var wrapper = { index: index, states: [] };
      Array.from(attributes).forEach(function (attr) {
        var attribute = { name: attr, value: input.getAttribute(attr) };
        switch (attribute.name) {
          case "type":
            if (attribute.value === "text") {
              wrapper.isText = true;
            }
            break;
          case "id":
            wrapper = this.verify(attribute, "id", wrapper, Types.HelpingId);
            break;
          case "name":
            wrapper = this.verify(
              attribute,
              "name",
              wrapper,
              Types.HelpingName
            );
            break;
          case "class":
            wrapper = this.verify(
              attribute,
              "class",
              wrapper,
              Types.HelpingClass
            );
            break;
          case "maxlength":
            if (attribute.value > 5 && attribute.value <= 10) {
              if (this.pnrGuard(wrapper)) {
                wrapper.maxlengthMatch = true;
                wrapper.forPnr = true;
                wrapper.states.push(Types.HelpingMaxLengthForPnr);
              }
              this.giveUp("Unknown state. maxlength too small.", wrapper);
            }
            break;
          default:
            if (attribute.name.startsWith("data")) {
              wrapper = this.verify(
                attribute,
                attribute.name,
                wrapper,
                Types.HelpingDataAttr
              );
            }
            break;
        }
      });

      if (!wrapper.cannotSay && wrapper.isText) {
        Context.textWrappers.push(wrapper);
      }

      console.log(Context);

      // if (type && type === "text") {
      //   var wrapped = {
      //     ref: input
      //   };
      //   this.textInputs.push(input);
      // }
    });
  },
  begin: function () {
    try {
      this.findCandidates();
    } catch (e) {
      console.log(Context);
      console.log(e);
    }
  }
};

var Walker = {
  Specs: [
    {
      title: "Only Two Input Elements",
      description: "SG uses this approach.",
      index: 0
    },
    {
      title: "Many Input Elements",
      description: "Vistara uses this",
      index: 1
    }
  ],
  Rules: [{ id: "Found exact two", confidence: 0.5 }],
  greet: function (message) {
    console.log(message);
  },
  spy: function () {
    return Spy.findCandidates();
  }
};

export { Walker };
