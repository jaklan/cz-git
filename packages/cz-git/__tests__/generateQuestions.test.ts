/**
 * @description: generateQuestions Test
 */

import { generateQuestions } from "../lib/loader";

describe("generateQuestions()", () => {
  let options: any;

  beforeEach(() => {
    options = {};
  });

  const mockedCz = {
    Separator: function () {
      return this;
    }
  };
  const fn = () => "";
  const getQuestion = (index: number) => {
    const question = generateQuestions(options, mockedCz);
    if (question) {
      return question[index - 1];
    } else {
      return undefined;
    }
  };

  test("error config be return false and print log", () => {
    expect(generateQuestions({}, undefined)).toBe(false);
  });

  test("test questions be returned", () => {
    options = {
      types: [{ value: "feat", name: "feat: this is a feature" }],
      scopes: ["cz-git"]
    };
    // test question 1 - type
    expect(getQuestion(1)?.name).toEqual("type");
    expect(getQuestion(1)?.type).toEqual("autocomplete");
    let mockTypesSourceFn = getQuestion(1)?.source || fn;
    expect(mockTypesSourceFn({}, "f")).toEqual([
      {
        value: "feat",
        name: "feat: this is a feature"
      }
    ]);

    // test question 2 - scope
    expect(getQuestion(2)?.name).toEqual("scope");
    expect(getQuestion(2)?.type).toEqual("autocomplete");
    mockTypesSourceFn = getQuestion(2)?.source || fn;
    expect(mockTypesSourceFn({}, "")).toEqual([
      { name: "empty", value: false },
      { name: "custom", value: "___CUSTOM___" },
      {},
      { name: "cz-git", value: "cz-git" }
    ]);
    expect(mockTypesSourceFn({}, "cz")).toEqual([{ name: "cz-git", value: "cz-git" }]);
    expect(mockTypesSourceFn({}, "em")).toEqual([{ name: "empty", value: false }]);
    expect(mockTypesSourceFn({}, "cu")).toEqual([{ name: "custom", value: "___CUSTOM___" }]);
    expect(mockTypesSourceFn({}, "aaa")).toEqual([]);
  });
});
