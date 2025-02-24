/**
 * @description: generate commitizen config option(generateOptions) | generate commitizen questions(generateQuestions)
 * @author: @Zhengqbbb (zhengqbbb@gmail.com)
 * @license: MIT
 */

// @ts-ignore
import { commitizenConfigLoader } from "@cz-git/loader";
import { defaultConfig, Option, UserConfig } from "./share";
import {
  getMaxLength,
  getMinLength,
  getProcessSubject,
  getMaxSubjectLength,
  handleStandardScopes,
  handleCustomTemplate,
  buildCommit,
  log,
  enumRuleIsActive,
  getEnumList,
  getValueByCallBack
} from "./until";
import type { Answers, Config, CommitizenGitOptions } from "./share";

/**
 * @description: Compatibility support for cz-conventional-changelog
 */
const {
  CZ_SCOPE,
  CZ_SUBJECT,
  CZ_BODY,
  CZ_ISSUES,
  CZ_MAN_HEADER_LENGTH,
  CZ_MAN_SUBJECT_LENGTH,
  CZ_MIN_SUBJECT_LENGTH
} = process.env;

const pkgConfig: Config = commitizenConfigLoader() ?? {};

/* eslint-disable prettier/prettier */
/* prettier-ignore */
export const generateOptions = (clConfig: UserConfig): CommitizenGitOptions => {
  let clPromptConfig = clConfig.prompt ?? {};
  clPromptConfig = getValueByCallBack(
    clPromptConfig,
    ["defaultScope", "defaultSubject", "defaultBody", "defaultFooterPrefix", "defaultIssues"]
  )

  return {
    messages: pkgConfig.messages ?? clPromptConfig.messages ?? defaultConfig.messages,
    types: pkgConfig.types ?? clPromptConfig.types ?? defaultConfig.types,
    typesAppend: pkgConfig.typesAppend ?? clPromptConfig.typesAppend ?? defaultConfig.typesAppend,
    useEmoji: pkgConfig.useEmoji ?? clPromptConfig.useEmoji ?? defaultConfig.useEmoji,
    scopes: pkgConfig.scopes ?? clPromptConfig.scopes ?? getEnumList(clConfig?.rules?.["scope-enum"] as any),
    scopeOverrides: pkgConfig.scopeOverrides ?? clPromptConfig.scopeOverrides ?? defaultConfig.scopeOverrides,
    allowCustomScopes: pkgConfig.allowCustomScopes ?? clPromptConfig.allowCustomScopes ?? !enumRuleIsActive(clConfig?.rules?.["scope-enum"] as any),
    allowEmptyScopes: pkgConfig.allowEmptyScopes ?? clPromptConfig.allowEmptyScopes ?? defaultConfig.allowEmptyScopes,
    customScopesAlign: pkgConfig.customScopesAlign ?? clPromptConfig.customScopesAlign ?? defaultConfig.customScopesAlign,
    customScopesAlias: pkgConfig.customScopesAlias ?? clPromptConfig.customScopesAlias ?? defaultConfig.customScopesAlias,
    emptyScopesAlias: pkgConfig.emptyScopesAlias ?? clPromptConfig.emptyScopesAlias ?? defaultConfig.emptyScopesAlias,
    upperCaseSubject: pkgConfig.upperCaseSubject ?? clPromptConfig.upperCaseSubject ?? defaultConfig.upperCaseSubject,
    allowBreakingChanges: pkgConfig.allowBreakingChanges ?? clPromptConfig.allowBreakingChanges ?? defaultConfig.allowBreakingChanges,
    breaklineNumber: getMaxLength(clConfig?.rules?.["body-max-line-length"] as any) === Infinity
      ? pkgConfig.breaklineNumber ?? clPromptConfig.breaklineNumber ?? defaultConfig.breaklineNumber
      : getMaxLength(clConfig?.rules?.["body-max-line-length"] as any),
    breaklineChar: pkgConfig.breaklineChar ?? clPromptConfig.breaklineChar ?? defaultConfig.breaklineChar,
    skipQuestions: pkgConfig.skipQuestions ?? clPromptConfig.skipQuestions ?? defaultConfig.skipQuestions,
    issuePrefixs: pkgConfig.issuePrefixs ?? clPromptConfig.issuePrefixs ?? defaultConfig.issuePrefixs,
    customIssuePrefixsAlign: pkgConfig.customIssuePrefixsAlign ?? clPromptConfig.customIssuePrefixsAlign ?? defaultConfig.customIssuePrefixsAlign,
    emptyIssuePrefixsAlias: pkgConfig.emptyIssuePrefixsAlias ?? clPromptConfig.emptyIssuePrefixsAlias ?? defaultConfig.emptyIssuePrefixsAlias,
    customIssuePrefixsAlias: pkgConfig.customIssuePrefixsAlias ?? clPromptConfig.customIssuePrefixsAlias ?? defaultConfig.customIssuePrefixsAlias,
    confirmColorize: pkgConfig.confirmColorize ?? clPromptConfig.confirmColorize ?? defaultConfig.confirmColorize,
    maxHeaderLength: CZ_MAN_HEADER_LENGTH
      ? parseInt(CZ_MAN_HEADER_LENGTH)
      : clPromptConfig.maxHeaderLength ?? getMaxLength(clConfig?.rules?.["header-max-length"] as any),
    maxSubjectLength: CZ_MAN_SUBJECT_LENGTH
      ? parseInt(CZ_MAN_SUBJECT_LENGTH)
      : clPromptConfig.maxSubjectLength ?? getMaxLength(clConfig?.rules?.["subject-max-length"] as any),
    minSubjectLength: CZ_MIN_SUBJECT_LENGTH
      ? parseInt(CZ_MIN_SUBJECT_LENGTH)
      : clPromptConfig.minSubjectLength ?? getMinLength(clConfig?.rules?.["subject-min-length"] as any),
    defaultScope: CZ_SCOPE ?? clPromptConfig.defaultScope ?? defaultConfig.defaultScope,
    defaultSubject: CZ_SUBJECT ?? clPromptConfig.defaultSubject ?? defaultConfig.defaultSubject,
    defaultBody: CZ_BODY ?? clPromptConfig.defaultBody ?? defaultConfig.defaultBody,
    defaultFooterPrefix: clPromptConfig.defaultFooterPrefix ?? defaultConfig.defaultFooterPrefix,
    defaultIssues: CZ_ISSUES ?? clPromptConfig.defaultIssues ?? defaultConfig.defaultIssues
  }
}

export const generateQuestions = (options: CommitizenGitOptions, cz: any) => {
  if (!Array.isArray(options.types) || options.types.length === 0) {
    log("err", "Error [types] Option");
    return false;
  }

  return [
    {
      type: "autocomplete",
      name: "type",
      message: options.messages?.type,
      source: (_: unknown, input: string) => {
        const typesSource = options.types?.concat(options.typesAppend || []) || [];
        return typesSource.filter((item) => (input ? item.value.includes(input) : true)) || true;
      }
    },
    {
      type: "autocomplete",
      name: "scope",
      message: options.messages?.scope,
      source: (answer: Answers, input: string) => {
        let scopes: Option[] = [];
        if (options.scopeOverrides && answer.type && options.scopeOverrides[answer.type]) {
          scopes = handleStandardScopes(options.scopeOverrides[answer.type]);
        } else if (Array.isArray(options.scopes)) {
          scopes = handleStandardScopes(options.scopes);
        }
        scopes = handleCustomTemplate(
          scopes,
          cz,
          options.customScopesAlign,
          options.emptyScopesAlias,
          options.customScopesAlias,
          options.allowCustomScopes,
          options.allowEmptyScopes
        );
        return scopes?.filter((item) => (input ? item.name?.includes(input) : true)) || true;
      }
    },
    {
      type: "input",
      name: "scope",
      message: options.messages?.customScope,
      default: options.defaultScope || undefined,
      when(answers: Answers) {
        return answers.scope === "___CUSTOM___";
      }
    },
    {
      type: "input",
      name: "subject",
      message: options.messages?.subject,
      validate(subject: string, answers: Answers) {
        const processedSubject = getProcessSubject(subject);
        if (processedSubject.length === 0)
          return "\u001B[1;31m[ERROR] subject is required\u001B[0m";
        if (!options.minSubjectLength && !options.maxSubjectLength) {
          log("err", "Error [Subject Length] Option");
          return false;
        }
        const maxSubjectLength = getMaxSubjectLength(answers.type, answers.scope, options);
        if (options.minSubjectLength && processedSubject.length < options.minSubjectLength)
          return `\u001B[1;31m[ERROR]subject length must be greater than or equal to ${options.minSubjectLength} characters\u001B[0m`;
        if (processedSubject.length > maxSubjectLength)
          return `\u001B[1;31m[ERROR]subject length must be less than or equal to ${maxSubjectLength} characters\u001B[0m`;
        return true;
      },
      transformer: (subject: string, answers: Answers) => {
        const { minSubjectLength } = options;
        const subjectLength = subject.length;
        const maxSubjectLength = getMaxSubjectLength(answers.type, answers.scope, options);
        let tooltip;
        if (minSubjectLength !== undefined && subjectLength < minSubjectLength)
          tooltip = `${minSubjectLength - subjectLength} more chars needed`;
        else if (subjectLength > maxSubjectLength)
          tooltip = `${subjectLength - maxSubjectLength} chars over the limit`;
        else tooltip = `${maxSubjectLength - subjectLength} more chars allowed`;
        const tooltipColor =
          minSubjectLength !== undefined &&
            subjectLength >= minSubjectLength &&
            subjectLength <= maxSubjectLength
            ? "\u001B[90m"
            : "\u001B[31m";
        const subjectColor =
          minSubjectLength !== undefined &&
            subjectLength >= minSubjectLength &&
            subjectLength <= maxSubjectLength
            ? "\u001B[36m"
            : "\u001B[31m";

        return `${tooltipColor}[${tooltip}]\u001B[0m\n  ${subjectColor}${subject}\u001B[0m`;
      },
      filter(subject: string) {
        const upperCaseSubject = options.upperCaseSubject || false;

        return (
          (upperCaseSubject ? subject.charAt(0).toUpperCase() : subject.charAt(0).toLowerCase()) +
          subject.slice(1)
        );
      },
      default: options.defaultSubject || undefined
    },
    {
      type: "input",
      name: "body",
      message: options.messages?.body,
      default: options.defaultBody || undefined
    },
    {
      type: "input",
      name: "breaking",
      message: options.messages?.breaking,
      default: options.defaultBody || undefined,
      when(answers: Answers) {
        if (
          options.allowBreakingChanges &&
          answers.type &&
          options.allowBreakingChanges.includes(answers.type)
        ) {
          return true;
        } else {
          return false;
        }
      }
    },
    {
      type: "autocomplete",
      name: "footerPrefix",
      message: options.messages?.footerPrefixsSelect,
      source: (_: Answers, input: string) => {
        const issues = handleCustomTemplate(
          options.issuePrefixs as Option[],
          cz,
          options.customIssuePrefixsAlign,
          options.emptyIssuePrefixsAlias,
          options.customIssuePrefixsAlias
        )
        return issues?.filter((item) => (input ? item.name?.includes(input) : true)) || true;
      }
    },
    {
      type: "input",
      name: "footerPrefix",
      message: options.messages?.customFooterPrefixs,
      default: options.defaultIssues || undefined,
      when(answers: Answers) {
        return answers.footerPrefix === "___CUSTOM___";
      }
    },
    {
      type: "input",
      name: "footer",
      default: options.defaultIssues || undefined,
      when(answers: Answers) {
        return (answers.footerPrefix as string | boolean) !== false;
      },
      message: options.messages?.footer
    },
    {
      type: "expand",
      name: "confirmCommit",
      choices: [
        { key: "y", name: "Yes", value: "yes" },
        { key: "n", name: "Abort commit", value: "no" },
        { key: "e", name: "Edit message", value: "edit" }
      ],
      default: 0,
      message(answers: Answers) {
        const SEP = options.confirmColorize
          ? "\u001B[1;90m###--------------------------------------------------------###\u001B[0m"
          : "###--------------------------------------------------------###";
        console.info(
          `\n${SEP}\n${buildCommit(answers, options, options.confirmColorize)}\n${SEP}\n`
        );
        return options.messages?.confirmCommit;
      }
    }
  ].filter((i) => !options.skipQuestions?.includes(i.name as "scope" | "body" | "breaking" | "footer" | "footerPrefix"));
};

type GenerateQuestionsType = typeof generateQuestions;
export type QuestionsType = ReturnType<GenerateQuestionsType>;
