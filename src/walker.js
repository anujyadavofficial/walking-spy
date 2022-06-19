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
  editableWrappers: [],
  reasons: [],
  pnrContext: { texts: ["pnr", "ticket", "number"], type: "Pnr" },
  nameContext: { texts: ["email", "last", "name"], type: "Name" }
};

var Spy = {
  //candidates: [],
  //textInputs: [],
  addCandidate: function (candidate) {
    var wrapper = {
      ref: candidate
    };

    this.candidates.push(wrapper);
    return wrapper;
  },
  hasGivenUp: function () {
    return Context.reasons.length > 0;
  },
  markText: function (wrapper) {
    var others = [
      "button",
      "checkbox",
      "color",
      "date",
      "datetime-local",
      "file",
      "hidden",
      "image",
      "month",
      "number",
      "password",
      "radio",
      "range",
      "reset",
      "search",
      "submit",
      "tel",
      "time",
      "url",
      "week"
    ];
    var ref = wrapper.ref;

    if (!ref.getAttribute) {
      return false;
    }
    var tag = ref.tagName;
    var type = ref.getAttribute("type");

    var textual =
      (tag.toLowerCase() === "input" || tag.toLowerCase() === "textarea") &&
      others.indexOf(type) === -1;
    var enabled = ref.disabled === false && ref.readOnly === false;

    if (textual) {
      wrapper.textual = true;
    }
    if (enabled) {
      wrapper.enabled = true;
    }
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
  verify: function (attr, matchFor, wrappedCandidate, state) {
    var matchKey = matchFor.startsWith("data")
      ? matchFor.replace(/-/g, "_") + "Match"
      : matchFor + "Match";

    if (this.similar(this.pnrContext.texts, attr.value)) {
      if (this.pnrGuard(wrappedCandidate)) {
        wrappedCandidate[matchKey] = true;
        wrappedCandidate.forPnr = true;
        wrappedCandidate.states.push(state);
      }
      this.giveUp("Ambiguous classification.", wrappedCandidate);
    } else if (this.similar(this.nameContext.texts, attr.value)) {
      if (this.nameGuard(wrappedCandidate)) {
        wrappedCandidate[matchKey] = true;
        wrappedCandidate.forName = true;
        wrappedCandidate.states.push(state);
      }
      this.giveUp("Ambiguous classification.", wrappedCandidate);
    }
  },
  prepareCandidates: function () {
    var inputs = document.body.getElementsByTagName("input");
    var editables = document.querySelectorAll("[contenteditable=true]");

    Array.from(inputs).forEach(function (input) {
      var wrapper = {
        ref: input,
        states: []
      };
      this.classifyText(wrapper);
      Context.candidates.push(wrapper);
    });

    Array.from(editables).forEach(function (editable) {
      var wrapper = {
        ref: editable,
        states: [],
        editable: true
      };
      Context.candidates.push(wrapper);
    });
  },
  findCandidates: function () {
    this.prepareCandidates();

    if (!Context.candidates || Context.candidates.length === 0) {
      this.giveUp("Failed to find candidates");
    }

    Array.from(Context.candidates).forEach(function (wrappedCandidate, index) {
      wrappedCandidate.index = index;

      var ref = wrappedCandidate.ref;
      var attributes = ref.getAttributeNames();
      console.log(attributes);

      Array.from(attributes).forEach(function (attr) {
        var attribute = { name: attr, value: ref.getAttribute(attr) };
        switch (attribute.name) {
          case "type":
            if (attribute.value === "text") {
              wrappedCandidate.isText = true;
            }
            break;
          case "id":
            this.verify(attribute, "id", wrappedCandidate, Types.HelpingId);
            break;
          case "name":
            this.verify(attribute, "name", wrappedCandidate, Types.HelpingName);
            break;
          case "class":
            this.verify(
              attribute,
              "class",
              wrappedCandidate,
              Types.HelpingClass
            );
            break;
          case "maxlength":
            if (attribute.value > 5 && attribute.value <= 10) {
              if (this.pnrGuard(wrappedCandidate)) {
                wrappedCandidate.maxlengthMatch = true;
                wrappedCandidate.forPnr = true;
                wrappedCandidate.states.push(Types.HelpingMaxLengthForPnr);
              }
              this.giveUp(
                "Unknown state. maxlength too small.",
                wrappedCandidate
              );
            }
            break;
          default:
            if (attribute.name.startsWith("data")) {
              this.verify(
                attribute,
                attribute.name,
                wrappedCandidate,
                Types.HelpingDataAttr
              );
            }
            break;
        }
      });

      // TODO: Filter
      if (!wrappedCandidate.cannotSay) {
        if (wrappedCandidate.textual && wrappedCandidate.enabled) {
          Context.textWrappers.push(wrappedCandidate);
        } else if (wrappedCandidate.enabled) {
          Context.editableWrappers.push(wrappedCandidate);
        }
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
    return Spy.begin();
  }
};

export { Walker };
