import { describe, expect } from "@jest/globals";
import { getAdjacentSpeechCaptionsBasedOnCodeActionIndex } from "../../src/utils/getAdjacentSpeechCaptionsBasedOnCodeActionIndex";
import { IAction } from "@fullstackcraftllc/codevideo-types";

describe("getSpeechCaptionBasedOnCodeActionIndex", () => {
  it("should return the correct speech caption when speak-before is before the provided index", () => {
    const actions: Array<IAction> = [
      { name: "author-speak-before", value: "here is some before speech" },
      { name: "editor-type", value: "console.log('hello world!')" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      1,
      actions
    );
    expect(speechCaption).toEqual([{
      speechType: "author-speak-before",
      speechValue: "here is some before speech",
    }]);
  });
  it("should return the nearest speech caption when speak-after is after the provided index", () => {
    const actions: Array<IAction> = [
      { name: "editor-type", value: "console.log('hello world!')" },
      { name: "author-speak-after", value: "here is some after speech" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      0,
      actions
    );
    expect(speechCaption).toEqual([
      {
        speechType: "author-speak-after",
        speechValue: "here is some after speech",
      },
    ]);
  });
  it("should return both speak-before and speak-before if both are adjacent", () => {
    const actions: Array<IAction> = [
      { name: "author-speak-before", value: "here is some before speech" },
      { name: "editor-type", value: "console.log('hello world!')" },
      { name: "author-speak-after", value: "here is some after speech" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      1,
      actions
    );
    expect(speechCaption).toEqual([
      {
        speechType: "author-speak-before",
        speechValue: "here is some before speech",
      },
      {
        speechType: "author-speak-after",
        speechValue: "here is some after speech",
      },
    ]);
  });
  it("should still return the most adjacent speak-before if there are multiple speak-before", () => {
    const actions: Array<IAction> = [
      { name: "author-speak-before", value: "here is some before speech" },
      { name: "author-speak-before", value: "here is some before speech 2" },
      { name: "editor-type", value: "console.log('hello world!')" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      2,
      actions
    );
    expect(speechCaption).toEqual([
      {
        speechType: "author-speak-before",
        speechValue: "here is some before speech 2",
      },
    ]);
  });
  it("should still return the most adjacent speak-after if there are multiple speak-after", () => {
    const actions: Array<IAction> = [
      { name: "editor-type", value: "console.log('hello world!')" },
      { name: "author-speak-after", value: "here is some after speech" },
      { name: "author-speak-after", value: "here is some after speech 2" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      0,
      actions
    );
    expect(speechCaption).toEqual([
      {
        speechType: "author-speak-after",
        speechValue: "here is some after speech",
      },
    ]);
  });
  it("should return an empty array if there are no speak-before or speak-after", () => {
    const actions: Array<IAction> = [
      { name: "editor-type", value: "console.log('hello world!')" },
      { name: "editor-type", value: "console.log('hello world!')" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      0,
      actions
    );
    expect(speechCaption).toEqual([]);
  });
  it("should return both speak-before and speak-before if both are adjacent and there are many on both sides", () => {
    const actions: Array<IAction> = [
      { name: "author-speak-before", value: "here is some before speech" },
      { name: "author-speak-before", value: "here is some before speech 2" },
      { name: "editor-type", value: "console.log('hello world!')" },
      { name: "author-speak-after", value: "here is some after speech" },
      { name: "author-speak-after", value: "here is some after speech 2" },
    ];
    const speechCaption = getAdjacentSpeechCaptionsBasedOnCodeActionIndex(
      2,
      actions
    );
    expect(speechCaption).toEqual([
      {
        speechType: "author-speak-before",
        speechValue: "here is some before speech 2",
      },
      {
        speechType: "author-speak-after",
        speechValue: "here is some after speech",
      },
    ]);
  });
});
