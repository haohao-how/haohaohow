import {
  buildHanziWord,
  characterHasGlyph,
  hanziFromHanziWord,
  hanziToLearnForHanzi,
  loadDictionary,
  loadStandardPinyinChart,
  lookupHanziWord,
  meaningKeyFromHanziWord,
  splitCharacters,
  splitPinyin,
} from "@/dictionary/dictionary";
import {
  inverseSortComparator,
  sortComparatorNumber,
} from "@/util/collections";
import { invariant } from "@haohaohow/lib/invariant";
import { HanziWord, HanziWordSkill, Skill, SkillType } from "./model";
import { MarshaledSkill, rSkillMarshal } from "./rizzleSchema";

export interface Node {
  skill: Skill;
  dependencies: Set<MarshaledSkill>; // todo: when are weights added?
}

export type SkillLearningGraph = Map<MarshaledSkill, Node>;

export interface LearningOptions {
  learnNameBeforePinyin?: boolean;
  learnPinyinInitialBeforeFinal?: boolean;
  learnPinyinFinalBeforeTone?: boolean;
}

export async function skillLearningGraph(options: {
  targetSkills: Skill[];
  isSkillLearned: (skill: MarshaledSkill) => boolean;
  learningOptions?: LearningOptions;
}): Promise<SkillLearningGraph> {
  const learningOptions = options.learningOptions ?? {};
  const graph: SkillLearningGraph = new Map();

  async function addSkill(skill: Skill): Promise<void> {
    const id = rSkillMarshal(skill);

    // Skip over any skills (and its dependency tree) that have already been
    // learned.
    if (options.isSkillLearned(id)) {
      return;
    }

    // Skip doing any work if the skill is already in the graph.
    if (graph.has(id)) {
      return;
    }

    const dependencies = await skillDependencies(skill, learningOptions).then(
      (x) => x.filter((s) => !options.isSkillLearned(rSkillMarshal(s))),
    );

    const node: Node = {
      skill,
      dependencies: new Set(dependencies.map((dep) => rSkillMarshal(dep))),
    };
    graph.set(id, node);

    for (const dependency of dependencies) {
      await addSkill(dependency);
    }
  }

  for (const skill of options.targetSkills) {
    await addSkill(skill);
  }

  return graph;
}

export async function skillDependencies(
  skill: Skill,
  learningOptions: LearningOptions,
): Promise<Skill[]> {
  const deps: Skill[] = [];
  switch (skill.type) {
    case SkillType.EnglishToHanziWord: {
      // Learn the Hanzi -> English first. It's easier to read than write (for chinese characters).
      deps.push({
        type: SkillType.HanziWordToEnglish,
        hanziWord: skill.hanziWord,
      });
      break;
    }
    case SkillType.HanziWordToEnglish: {
      // Learn the components of a hanzi word first.
      const hanziToLearn = await hanziToLearnForHanzi(
        splitCharacters(hanziFromHanziWord(skill.hanziWord)),
      );
      for (const hanzi of hanziToLearn) {
        if (await characterHasGlyph(hanzi)) {
          // TODO: need to a better way to choose the meaning key.
          const meaningKey = await guessHanziMeaningKey(hanzi);
          if (meaningKey != null) {
            deps.push({
              type: SkillType.HanziWordToEnglish,
              hanziWord: buildHanziWord(hanzi, meaningKey),
            });
          }
        }
      }
      break;
    }
    case SkillType.HanziWordToPinyinFinal: {
      // Learn the mnemonic associations for the final first.

      // Only do this for single characters
      const hanzi = hanziFromHanziWord(skill.hanziWord);
      if (splitCharacters(hanzi).length > 1) {
        break;
      }

      if (learningOptions.learnPinyinInitialBeforeFinal === true) {
        deps.push({
          type: SkillType.HanziWordToPinyinInitial,
          hanziWord: skill.hanziWord,
        });
      }

      const res = await lookupHanziWord(skill.hanziWord);
      if (!res) {
        break;
      }

      const chart = await loadStandardPinyinChart();
      // TODO: when there are multiple pinyin, what should happen?
      const pinyin = res.pinyin?.[0];

      if (pinyin == null) {
        console.error(new Error(`no pinyin for ${skill.hanziWord}`));
        break;
      }

      const final = splitPinyin(pinyin, chart)?.final;
      if (final == null) {
        console.error(
          new Error(`could not extract pinyin final for ${pinyin} `),
        );
        break;
      }

      deps.push({
        type: SkillType.PinyinFinalAssociation,
        final,
      });
      break;
    }
    case SkillType.HanziWordToPinyinInitial: {
      // Learn the mnemonic associations for the final first.

      // Only do this for single characters
      const hanzi = hanziFromHanziWord(skill.hanziWord);
      if (splitCharacters(hanzi).length > 1) {
        break;
      }

      const res = await lookupHanziWord(skill.hanziWord);
      if (!res) {
        break;
      }

      const chart = await loadStandardPinyinChart();

      const pinyin = res.pinyin?.[0];
      if (pinyin == null) {
        console.error(new Error(`no pinyin for ${skill.hanziWord}`));
        break;
      }

      const initial = splitPinyin(pinyin, chart)?.initial;
      if (initial == null) {
        console.error(
          new Error(`could not extract pinyin initial for ${pinyin} `),
        );
        break;
      }

      deps.push({
        type: SkillType.PinyinInitialAssociation,
        initial,
      });

      break;
    }
    case SkillType.PinyinToHanziWord: {
      // Learn going from Hanzi -> Pinyin first.
      deps.push(
        {
          type: SkillType.HanziWordToPinyinInitial,
          hanziWord: skill.hanziWord,
        },
        {
          type: SkillType.HanziWordToPinyinFinal,
          hanziWord: skill.hanziWord,
        },
        {
          type: SkillType.HanziWordToPinyinTone,
          hanziWord: skill.hanziWord,
        },
      );
      break;
    }
    case SkillType.HanziWordToPinyinTone: {
      // Learn the mnemonic associations for the final first.

      // Only do this for single characters
      const hanzi = hanziFromHanziWord(skill.hanziWord);
      if (splitCharacters(hanzi).length > 1) {
        break;
      }

      if (learningOptions.learnPinyinFinalBeforeTone === true) {
        deps.push({
          type: SkillType.HanziWordToPinyinFinal,
          hanziWord: skill.hanziWord,
        });
      }
      break;
    }
    case SkillType.Deprecated:
    case SkillType.ImageToHanziWord:
    case SkillType.PinyinInitialAssociation:
    case SkillType.PinyinFinalAssociation: {
      // Leaf skills (no dependencies).
      break;
    }
  }
  return deps;
}

async function guessHanziMeaningKey(
  hanzi: string,
): Promise<string | undefined> {
  const dict = await loadDictionary();
  for (const key of dict.keys()) {
    if (hanziFromHanziWord(key) === hanzi) {
      return meaningKeyFromHanziWord(key);
    }
  }
}

export function hanziWordToEnglish(hanziWord: HanziWord): HanziWordSkill {
  return {
    type: SkillType.HanziWordToEnglish,
    hanziWord,
  };
}

export function englishToHanziWord(hanziWord: HanziWord): HanziWordSkill {
  return {
    type: SkillType.EnglishToHanziWord,
    hanziWord,
  };
}

export function skillReviewQueue({
  graph,
  getSkillDueDate,
  now = new Date(),
}: {
  graph: SkillLearningGraph;
  getSkillDueDate: (skill: MarshaledSkill) => Date | undefined;
  now?: Date;
}): MarshaledSkill[] {
  // Kahn topological sort
  const inDegree = new Map<MarshaledSkill, number>();
  const queue: MarshaledSkill[] = [];
  const learningOrderDue: [MarshaledSkill, number][] = [];
  const learningOrderNew: MarshaledSkill[] = [];
  const learningOrderNotDue: [MarshaledSkill, number][] = [];

  // Compute in-degree
  for (const [marshaledSkill, node] of graph.entries()) {
    if (!inDegree.has(marshaledSkill)) {
      inDegree.set(marshaledSkill, 0);
    }

    for (const dependency of node.dependencies) {
      inDegree.set(dependency, (inDegree.get(dependency) ?? 0) + 1);
    }
  }

  // Find skills that have no prerequisites
  for (const [skill, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(skill);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const skill = queue.shift();
    invariant(skill != null);
    const dueDate = getSkillDueDate(skill);
    if (dueDate == undefined) {
      learningOrderNew.push(skill);
    } else if (dueDate > now) {
      learningOrderNotDue.push([skill, dueDate.getTime()]);
    } else {
      learningOrderDue.push([skill, dueDate.getTime()]);
    }

    const node = graph.get(skill);
    invariant(node != null);
    for (const dependent of node.dependencies) {
      const cur = inDegree.get(dependent);
      invariant(cur != null);
      const newValue = cur - 1;
      inDegree.set(dependent, newValue);
      if (newValue === 0) {
        queue.push(dependent);
      }
    }
  }

  return [
    ...learningOrderNotDue
      .sort(inverseSortComparator(sortComparatorNumber(([, due]) => due)))
      .map(([skill]) => skill),
    ...learningOrderNew,
    ...learningOrderDue
      .sort(inverseSortComparator(sortComparatorNumber(([, due]) => due)))
      .map(([skill]) => skill),
  ].reverse();
}

const skillTypeShorthandMapping: Record<SkillType, string> = {
  [SkillType.Deprecated_EnglishToRadical]: `[deprecated]`,
  [SkillType.Deprecated_PinyinToRadical]: `[deprecated]`,
  [SkillType.Deprecated_RadicalToEnglish]: `[deprecated]`,
  [SkillType.Deprecated_RadicalToPinyin]: `[deprecated]`,
  [SkillType.Deprecated]: `[deprecated]`,
  [SkillType.EnglishToHanziWord]: `EN → 中文`,
  [SkillType.HanziWordToEnglish]: `中文 → EN`,
  [SkillType.HanziWordToPinyinFinal]: `中文 → PY⁻ᶠ`,
  [SkillType.HanziWordToPinyinInitial]: `中文 → PYⁱ⁻`,
  [SkillType.HanziWordToPinyinTone]: `中文 → PYⁿ`,
  [SkillType.ImageToHanziWord]: `🏞️ → 中文`,
  [SkillType.PinyinFinalAssociation]: `PY⁻ᶠ → ✦`,
  [SkillType.PinyinInitialAssociation]: `PYⁱ⁻ → ✦`,
  [SkillType.PinyinToHanziWord]: `PY → 中文`,
};

export function skillTypeToShorthand(skillType: SkillType): string {
  return skillTypeShorthandMapping[skillType];
}
