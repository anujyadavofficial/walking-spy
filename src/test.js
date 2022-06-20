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

function markText(wrapper) {
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
    others.indexOf(type) === -1 &&
    type === "text";
  var enabled = ref.disabled === false && ref.readOnly === false;

  if (textual) {
    wrapper.textual = true;
  }
  if (enabled) {
    wrapper.enabled = true;
  }
}

function hasGivenUp(context) {
  return context.reasons.length > 0;
}

function pnrGuard(context, wrapper) {
  return !hasGivenUp(context) && !wrapper.forName && !wrapper.cannotSay;
}

function nameGuard(context, wrapper) {
  return !hasGivenUp(context) && !wrapper.forPnr && !wrapper.cannotSay;
}

function giveUp(context, message, wrapper) {
  if (wrapper) {
    wrapper.cannotSay = true;
  }
  var giveUpData = Types.GivingUp;
  giveUpData.message = message;
  giveUpData.wrapper = wrapper;

  context.reasons.push(giveUpData);

  throw "Giving Up";
}

function similar(texts, str) {
  var present = false;
  Array.from(texts).forEach(function (text) {
    if (text.indexOf(str)) {
      present = true;
    }
  });
  return present;
}

function verify(context, attr, matchFor, wrappedCandidate, state) {
  var matchKey = matchFor.startsWith("data")
    ? matchFor.replace(/-/g, "_") + "Match"
    : matchFor + "Match";

  if (similar(context.pnrContext.texts, attr.value)) {
    if (pnrGuard(context, wrappedCandidate)) {
      wrappedCandidate[matchKey] = true;
      wrappedCandidate.forPnr = true;
      wrappedCandidate.states.push(state);
    } else {
      giveUp(context, "Ambiguous classification.", wrappedCandidate);
    }
  } else if (similar(context.nameContext.texts, attr.value)) {
    if (nameGuard(context, wrappedCandidate)) {
      wrappedCandidate[matchKey] = true;
      wrappedCandidate.forName = true;
      wrappedCandidate.states.push(state);
    } else {
      giveUp(context, "Ambiguous classification.", wrappedCandidate);
    }
  }
}

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
  prepareCandidates: function () {
    var inputs = document.body.getElementsByTagName("input");
    console.log("inputs", inputs);
    var editables = document.querySelectorAll("[contenteditable=true]");
    console.log("editables", editables);

    Array.from(inputs).forEach(function (input) {
      var wrapper = {
        ref: input,
        states: []
      };
      markText(wrapper);
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
  probables: function () {
    var result = {
      pnrWrapper: undefined,
      nameWrapper: undefined
    };
    var textuals = Context.textWrappers;
    var count = 0;
    var temp = undefined;
    textuals.forEach(function (textual) {
      if (textual.states.length > 0 && count === 0) {
        count = count + 1;
        temp = textual;
      } else if (textual.states.length > 0 && count !== 0) {
        count = 0;
      }
    });

    // TODO: Better
    if (temp) {
      temp.states.forEach(function (state) {
        if (
          count === 1 &&
          state.id === Types.HelpingMaxLengthForPnr.id &&
          textuals.length === 2
        ) {
          result.pnrWrapper = temp;
        }
      });
      temp = undefined;
    }

    var editables = Context.editableWrappers;
    editables.forEach(function (editable) {
      if (editable.states.length > 0 && count === 0) {
        count = count + 1;
        temp = editable;
      } else if (editable.states.length > 0 && count !== 0) {
        count = 0;
      }
    });

    // TODO: Better
    if (Context.textWrappers.length + Context.editableWrappers.length === 2) {
      if (result.pnrWrapper) {
        var index = Context.textWrappers.indexOf(result.pnrWrapper);
        if (index === -1 && Context.editableWrappers.length === 1) {
          result.nameWrapper = Context.editableWrappers[0];
        } else if (index !== -1 && Context.textWrappers.length === 2) {
          index = index === 0 ? 1 : 0;
          result.nameWrapper = Context.textWrappers[index];
        } else if (index === -1 && Context.editableWrappers.length === 2) {
          index = Context.editableWrappers.indexOf(result.pnrWrapper);
          index = index === 0 ? 1 : 0;
          result.nameWrapper = Context.editableWrappers[index];
        }
      }
    }

    return result;
  },
  parse: function () {
    this.prepareCandidates();

    if (!Context.candidates || Context.candidates.length === 0) {
      giveUp(Context, "Failed to find candidates");
    }

    Array.from(Context.candidates).forEach(function (wrappedCandidate, index) {
      wrappedCandidate.index = index;

      var ref = wrappedCandidate.ref;
      var attributes = ref.getAttributeNames();
      console.log(attributes);

      Array.from(attributes).forEach(function (attr) {
        var attribute = { name: attr, value: ref.getAttribute(attr) };
        switch (attribute.name) {
          case "id":
            verify(Context, attribute, "id", wrappedCandidate, Types.HelpingId);
            break;
          case "name":
            verify(
              Context,
              attribute,
              "name",
              wrappedCandidate,
              Types.HelpingName
            );
            break;
          case "class":
            verify(
              Context,
              attribute,
              "class",
              wrappedCandidate,
              Types.HelpingClass
            );
            break;
          case "maxlength":
            var val = attribute.value;
            console.log(val);
            if (attribute.value > 5 && attribute.value <= 10) {
              if (pnrGuard(Context, wrappedCandidate)) {
                wrappedCandidate.maxlengthMatch = true;
                wrappedCandidate.forPnr = true;
                wrappedCandidate.states.push(Types.HelpingMaxLengthForPnr);
              } else {
                giveUp(
                  Context,
                  "Unknown state. maxlength too small.",
                  wrappedCandidate
                );
              }
            }
            break;
          default:
            if (attribute.name.startsWith("data")) {
              verify(
                Context,
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
    });

    console.log(Context);
    var probables = this.probables();
    console.log(probables);
    if (probables.pnrWrapper && probables.nameWrapper) {
      probables.pnrWrapper.ref.focus();
      probables.pnrWrapper.ref.value = "ABCDEF";
      probables.nameWrapper.ref.focus();
      probables.nameWrapper.ref.value = "Rick Ponting";
    }
  },
  begin: function () {
    this.parse();
    try {
      //this.parse();
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

setTimeout(() => {
  Walker.spy();
}, 500);
