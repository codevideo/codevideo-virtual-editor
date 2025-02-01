import {
  IAction,
  ISpeechCaption,
  isAuthorAction,
} from "@fullstackcraftllc/codevideo-types";

export const getAdjacentSpeechCaptionsBasedOnCodeActionIndex = (
  index: number,
  actions: Array<IAction>
): Array<ISpeechCaption> => {
  const speechCaptions: Array<ISpeechCaption> = [];
  // if we are not at first action, get it!
  if (index > 0) {
    const prevAction = actions[index - 1];
    if (isAuthorAction(prevAction)) {
      speechCaptions.push({
        speechType: prevAction.name,
        speechValue: prevAction.value,
      });
    }
  }
  // if we are not at last action, get it!
  if (index < actions.length - 1) {
    const nextAction = actions[index + 1];
    if (isAuthorAction(nextAction)) {
      speechCaptions.push({
        speechType: nextAction.name,
        speechValue: nextAction.value,
      });
    }
  }

  return speechCaptions;
};
