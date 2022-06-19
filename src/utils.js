import { Types } from "./types";

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

export { markText, hasGivenUp, pnrGuard, nameGuard, giveUp, similar, verify };
