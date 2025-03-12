import {
  HanziWordSkill,
  OneCorrectPairQuestion,
  OneCorrectPairQuestionAnswer,
  OneCorrectPairQuestionChoice,
  QuestionFlag,
  QuestionFlagType,
  Skill,
  SkillRating,
  SkillType,
} from "@/data/model";
import {
  hanziFromHanziWord,
  lookupHanziWord,
  splitCharacters,
} from "@/dictionary/dictionary";
import { arrayFilterUniqueWithKey } from "@/util/collections";
import { Rating } from "@/util/fsrs";
import { invariant } from "@haohaohow/lib/invariant";
import { useQuery } from "@tanstack/react-query";
import { formatDuration } from "date-fns/formatDuration";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { Image } from "expo-image";
import {
  ElementRef,
  ReactNode,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tv } from "tailwind-variants";
import { AnswerButton } from "./AnswerButton";
import { HanziText } from "./HanziText";
import { NewSkillModal } from "./NewSkillModal";
import { RectButton2 } from "./RectButton2";
import { PropsOf } from "./types";

const buttonThickness = 4;
const gap = 12;

export const QuizDeckOneCorrectPairQuestion = memo(
  function QuizDeckOneCorrectPairQuestion({
    question,
    flag,
    onNext,
    onRating,
  }: {
    question: OneCorrectPairQuestion;
    flag?: QuestionFlag;
    onNext: () => void;
    onRating: (
      question: OneCorrectPairQuestion,
      ratings: SkillRating[],
    ) => void;
  }) {
    const { prompt, answer, hint, groupA, groupB } = question;
    const answerSkill = answer.a.skill;

    const [selectedAAnswer, setSelectedAAnswer] =
      useState<OneCorrectPairQuestionAnswer>();
    const [selectedBAnswer, setSelectedBAnswer] =
      useState<OneCorrectPairQuestionAnswer>();
    const [rating, setRating] = useState<Rating>();

    const choiceRowCount = Math.max(groupA.length, groupB.length);
    const choiceRows: {
      a: OneCorrectPairQuestionAnswer;
      b: OneCorrectPairQuestionAnswer;
    }[] = [];

    for (let i = 0; i < choiceRowCount; i++) {
      const a = groupA[i];
      const b = groupB[i];
      invariant(a !== undefined && b !== undefined, `missing choice`);
      choiceRows.push({ a, b });
    }

    invariant(groupA.includes(answer));

    const handleSubmit = () => {
      if (rating === undefined) {
        const rating =
          selectedAAnswer === answer && selectedBAnswer === answer
            ? Rating.Good
            : Rating.Again;

        const skillRatings: SkillRating[] = [
          selectedAAnswer?.a.skill,
          selectedAAnswer?.b.skill,
          selectedBAnswer?.a.skill,
          selectedBAnswer?.b.skill,
        ]
          .filter((x) => x != null)
          .map((skill) => ({ skill, rating }))
          .filter(arrayFilterUniqueWithKey((x) => JSON.stringify(x.skill)));

        setRating(rating);
        onRating(question, skillRatings);
      } else {
        onNext();
      }
    };

    const showResult = rating !== undefined;
    const isCorrect = rating !== Rating.Again;

    // const pinyinChartQuery = useQuery({
    //   queryKey: [QuizDeckOneCorrectPairQuestion.name, `pinyinChart`],
    //   queryFn: async () => {
    //     return await loadStandardPinyinChart();
    //   },
    // });

    // const answerPinyin = answer.b.type === `pinyin` ? answer.b.pinyin : null;
    // const splitAnswerPinyin =
    //   answerPinyin != null && pinyinChartQuery.data
    //     ? splitPinyin(answerPinyin, pinyinChartQuery.data)
    //     : null;

    // const pinyinNewHintQuery = useRizzleQuery(
    //   [QuizDeckOneCorrectPairQuestion.name, `association`, splitAnswerPinyin],
    //   async (r, tx) => {
    //     if (splitAnswerPinyin != null) {
    //       const { initial, final, tone } = splitAnswerPinyin;
    //       const initialRes = await r.query.pinyinInitialAssociation.get(tx, {
    //         initial: `${initial}-`,
    //       });
    //       const finalRes = await r.query.pinyinFinalAssociation.get(tx, {
    //         final: `-${final}`,
    //       });
    //       return {
    //         initial,
    //         initialMnemonic: initialRes?.name,
    //         final,
    //         finalMnemonic: finalRes?.name,
    //         tone,
    //         toneMnemonic: null as unknown as string | undefined, // TODO: implement
    //       };
    //     }
    //     return null;
    //   },
    // );

    // const pinyinHint =
    //   pinyinNewHintQuery.data != null
    //     ? `${pinyinNewHintQuery.data.initial}${pinyinNewHintQuery.data.initialMnemonic != null ? ` (${pinyinNewHintQuery.data.initialMnemonic})` : ``} + ${pinyinNewHintQuery.data.final}${pinyinNewHintQuery.data.finalMnemonic != null ? ` (${pinyinNewHintQuery.data.finalMnemonic})` : ``} + ${pinyinNewHintQuery.data.tone}${pinyinNewHintQuery.data.toneMnemonic != null ? ` (${pinyinNewHintQuery.data.toneMnemonic})` : ``}.`
    //     : null;

    // Show a lesson for new skills.
    // const isNewSkill = flag?.type === QuestionFlagType.NewSkill;
    // const skill = question.answer.a.skill ?? question.answer.b.skill;
    // useEffect(() => {
    //   if (isNewSkill && skill != null) {
    //     // push modal screen
    //     // router.push(`/learn/skill/${rSkillMarshal(skill)}`);
    //   }
    // }, [isNewSkill, skill]);

    return (
      <Skeleton
        toast={
          showResult ? (
            <View
              className={`flex-1 gap-[12px] ${isCorrect ? `success-theme` : `danger-theme`} bg-primary-5 px-quiz-px pt-3 pb-safe-offset-[84px] lg:mb-2 lg:rounded-xl`}
            >
              {isCorrect ? (
                <View className="flex-row items-center gap-[8px]">
                  <Image
                    className="h-[32px] w-[32px] flex-shrink text-accent-10"
                    source={require(`@/assets/icons/check-circled-filled.svg`)}
                    tintColor="currentColor"
                  />
                  <Text className="text-2xl font-bold text-accent-10">
                    Nice!
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row items-center gap-[8px]">
                    <Image
                      className="h-[32px] w-[32px] flex-shrink text-accent-10"
                      source={require(
                        `@/assets/icons/close-circled-filled.svg`,
                      )}
                      tintColor="currentColor"
                    />
                    <Text className="text-2xl font-bold text-accent-10">
                      Incorrect
                    </Text>
                  </View>
                  <Text className="text-xl/none font-bold text-accent-10">
                    Correct answer:
                  </Text>

                  <ShowSkillAnswer skill={answerSkill} includeAlternatives />

                  {hint == null ? null : (
                    <Text className="leading-snug text-accent-10">
                      <Text className="font-bold">Hint:</Text>
                      {hint}
                    </Text>
                  )}
                  {selectedAAnswer != null && selectedBAnswer != null ? (
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="flex-shrink-0 font-bold leading-snug text-accent-10">
                        Your answer:
                      </Text>
                      <View className="flex-1 flex-row flex-wrap items-center">
                        <ShowSkillAnswer
                          skill={selectedAAnswer.a.skill}
                          small
                        />
                        <Text className="flex-shrink-0 flex-grow-0 px-1 leading-snug text-accent-10 opacity-50">
                          +
                        </Text>
                        <ShowSkillAnswer
                          skill={selectedBAnswer.b.skill}
                          small
                        />
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ) : null
        }
        submitButton={
          <SubmitButton
            state={
              selectedAAnswer === undefined || selectedBAnswer === undefined
                ? SubmitButtonState.Disabled
                : showResult
                  ? isCorrect
                    ? SubmitButtonState.Correct
                    : SubmitButtonState.Incorrect
                  : SubmitButtonState.Check
            }
            onPress={handleSubmit}
          />
        }
      >
        {flag?.type === QuestionFlagType.NewSkill ? (
          <NewSkillModal skill={question.answer.a.skill} />
        ) : null}
        {flag == null ? null : <FlagText flag={flag} />}
        <View>
          <Text className="text-xl font-bold text-text">{prompt}</Text>
        </View>
        <View className="flex-1 justify-center py-quiz-px">
          <View
            className="flex-1"
            style={{
              gap: gap + buttonThickness,
              maxHeight:
                choiceRowCount * 80 +
                (choiceRowCount - 1) * gap +
                buttonThickness,
            }}
          >
            {choiceRows.map(({ a, b }, i) => (
              <View className="flex-1 flex-row gap-[28px]" key={i}>
                <ChoiceButton
                  choice={a.a}
                  selected={a === selectedAAnswer}
                  onPress={() => {
                    if (!showResult) {
                      setSelectedAAnswer(a);
                    }
                  }}
                />
                <ChoiceButton
                  choice={b.b}
                  selected={b === selectedBAnswer}
                  onPress={() => {
                    if (!showResult) {
                      setSelectedBAnswer(b);
                    }
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      </Skeleton>
    );
  },
);

const FlagText = ({ flag }: { flag: QuestionFlag }) => {
  switch (flag.type) {
    case QuestionFlagType.NewSkill: {
      return (
        <View className={flagViewClass({ class: `success-theme` })}>
          <Image
            source={require(`@/assets/icons/plant-filled.svg`)}
            className={flagIconClass()}
            tintColor="currentColor"
          />
          <Text className={flagTextClass()}>New skill</Text>
        </View>
      );
    }
    case QuestionFlagType.Overdue: {
      return (
        <View className={flagViewClass({ class: `danger-theme` })}>
          <Image
            source={require(`@/assets/icons/alarm.svg`)}
            className={flagIconClass()}
            tintColor="currentColor"
          />
          <Text className={flagTextClass()}>
            Overdue by{` `}
            {
              formatDuration(intervalToDuration(flag.interval), {
                format: [
                  `years`,
                  `months`,
                  `weeks`,
                  `days`,
                  `hours`,
                  `minutes`,
                ],
                zero: false,
                delimiter: `, `,
              }).split(`, `)[0]
            }
          </Text>
        </View>
      );
    }
    case QuestionFlagType.PreviousMistake: {
      return (
        <View className={flagViewClass({ class: `warning-theme` })}>
          <Image
            source={require(`@/assets/icons/repeat.svg`)}
            className={flagIconClass()}
            tintColor="currentColor"
          />
          <Text className={flagTextClass()}>Previous mistake</Text>
        </View>
      );
    }
    case QuestionFlagType.WeakWord: {
      return (
        <View className={flagViewClass({ class: `danger-theme` })}>
          <Image
            source={require(`@/assets/icons/flag.svg`)}
            className={flagIconClass()}
            tintColor="currentColor"
          />
          <Text className={flagTextClass()}>Weak word</Text>
        </View>
      );
    }
  }
};

const flagViewClass = tv({
  base: `flex-row items-center gap-1`,
});

const flagIconClass = tv({
  base: `h-[24px] w-[24px] flex-shrink text-accent-10`,
});

const flagTextClass = tv({
  base: `font-bold uppercase text-accent-10`,
});

const choiceEnglishText = tv({
  base: `text-xl/none text-accent-10`,
  variants: {
    small: {
      true: `text-md`,
    },
  },
});

const ShowSkillAnswer = ({
  skill,
  includeAlternatives = false,
  small = false,
}: {
  skill: Skill;
  includeAlternatives?: boolean;
  small?: boolean;
}) => {
  switch (skill.type) {
    case SkillType.HanziWordToPinyinInitial:
    case SkillType.HanziWordToPinyinFinal:
    case SkillType.HanziWordToPinyinTone:
    case SkillType.EnglishToHanziWord:
    case SkillType.PinyinToHanziWord:
    case SkillType.ImageToHanziWord:
    case SkillType.Deprecated:
    case SkillType.PinyinInitialAssociation:
    case SkillType.PinyinFinalAssociation: {
      throw new Error(`ShowSkillAnswer not implemented for ${skill.type}`);
    }
    case SkillType.HanziWordToEnglish: {
      return (
        <ShowHanziWordSkillAnswer
          skill={skill}
          includeAlternatives={includeAlternatives}
          small={small}
        />
      );
    }
  }
};

const ShowHanziWordSkillAnswer = ({
  skill,
  includeAlternatives = false,
  small = false,
}: {
  skill: HanziWordSkill;
  includeAlternatives?: boolean;
  small?: boolean;
}) => {
  const meaningQuery = useQuery({
    queryKey: [ShowSkillAnswer.name, `skill`, skill],
    queryFn: async () => {
      invariant(`hanziWord` in skill);
      const meaning = await lookupHanziWord(skill.hanziWord);
      return meaning;
    },
    enabled: `hanziWord` in skill,
  });

  const meaning = meaningQuery.data;

  if (meaning == null) {
    return null;
  }

  const primaryHanzi = hanziFromHanziWord(skill.hanziWord);
  const pinyin = meaning.pinyin?.[0];
  const gloss = meaning.gloss[0];
  const hanzis = [primaryHanzi];
  if (includeAlternatives && meaning.visualVariants != null) {
    hanzis.push(...meaning.visualVariants);
  }

  return (
    <View className={`flex-row items-center ${small ? `gap-1` : `gap-2`}`}>
      {hanzis.map((hanzi, i) => (
        <View
          key={i}
          className={hanzi === primaryHanzi ? undefined : `opacity-50`}
        >
          <HanziText
            pinyin={hanzi === primaryHanzi ? pinyin : undefined}
            hanzi={hanzi}
            small={small}
            accented
          />
        </View>
      ))}
      <Text className={choiceEnglishText({ small })}>{gloss}</Text>
    </View>
  );
};

const Skeleton = ({
  children,
  toast,
  submitButton,
}: {
  children: ReactNode;
  toast: ReactNode | null;
  submitButton: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  const submitButtonHeight = 44;
  const submitButtonInsetBottom = insets.bottom + 20;
  const contentInsetBottom = submitButtonInsetBottom + 5 + submitButtonHeight;

  const [slideInAnim] = useState(() => new Animated.Value(0));
  const hasToast = toast !== null;

  useEffect(() => {
    if (hasToast) {
      Animated.timing(slideInAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false, // layout properties aren't compatible with the native driver on mobile (it works on Web though)
      }).start();
    } else {
      Animated.timing(slideInAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [slideInAnim, hasToast]);

  const slideInStyle: StyleProp<ViewStyle> = useMemo(
    () =>
      Platform.OS === `web`
        ? {
            // On web the `bottom: <percent>%` approach doesn't work when the
            // parent is `position: absolute`. But using `translateY: <percent>%`
            // DOES work (but this doesn't work on mobile native because only
            // pixel values are accepted).
            transform: [
              {
                translateY: slideInAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`100%`, `0%`],
                }),
              },
            ],
          }
        : {
            position: `relative`,
            bottom: slideInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [`-100%`, `0%`],
            }),
          },
    [slideInAnim],
  );

  return (
    <>
      <View
        className="flex-1 px-quiz-px"
        style={{ paddingBottom: contentInsetBottom }}
      >
        {children}
      </View>
      {toast === null ? null : (
        <View className="absolute inset-x-0 bottom-0">
          <Animated.View style={slideInStyle}>{toast}</Animated.View>
        </View>
      )}
      <View
        className="absolute inset-x-quiz-px flex-row items-stretch"
        style={{
          bottom: submitButtonInsetBottom,
          height: submitButtonHeight,
        }}
      >
        {submitButton}
      </View>
    </>
  );
};

enum SubmitButtonState {
  Disabled,
  Check,
  Correct,
  Incorrect,
}

const SubmitButton = forwardRef<
  ElementRef<typeof RectButton2>,
  { state: SubmitButtonState } & Pick<PropsOf<typeof RectButton2>, `onPress`>
>(function SubmitButton({ state, onPress }, ref) {
  let text;

  switch (state) {
    case SubmitButtonState.Disabled:
    case SubmitButtonState.Check: {
      text = `Check`;
      break;
    }
    case SubmitButtonState.Correct: {
      text = `Continue`;
      break;
    }
    case SubmitButtonState.Incorrect: {
      text = `Got it`;
      break;
    }
  }

  return (
    <RectButton2
      variant="filled"
      ref={ref}
      disabled={state === SubmitButtonState.Disabled}
      className={`flex-1 ${state === SubmitButtonState.Incorrect ? `danger-theme` : `success-theme`}`}
      accent
      onPress={state === SubmitButtonState.Disabled ? undefined : onPress}
    >
      {text}
    </RectButton2>
  );
});

const ChoiceButton = ({
  selected,
  choice,
  onPress,
}: {
  selected: boolean;
  choice: OneCorrectPairQuestionChoice;
  onPress: (choice: OneCorrectPairQuestionChoice) => void;
}) => {
  const handlePress = useCallback(() => {
    onPress(choice);
  }, [onPress, choice]);

  const textQuery = useQuery({
    queryKey: [QuizDeckOneCorrectPairQuestion.name, `choiceText`, choice],
    queryFn: async (): Promise<string> => {
      const meaning = await lookupHanziWord(choice.hanziWord);
      invariant(
        meaning != null,
        `missing meaning for hanzi word ${choice.hanziWord}`,
      );

      switch (choice.type) {
        case `hanzi`: {
          return hanziFromHanziWord(choice.hanziWord);
        }
        case `pinyin`: {
          invariant(
            meaning.pinyin != null,
            `missing pinyin array for hanzi word ${choice.hanziWord}`,
          );
          const [pinyin] = meaning.pinyin;
          invariant(
            pinyin != null,
            `missing pinyin for hanzi word ${choice.hanziWord}`,
          );
          return pinyin;
        }
        case `gloss`: {
          const [gloss] = meaning.gloss;
          invariant(
            gloss != null,
            `missing gloss for hanzi word ${choice.hanziWord}`,
          );
          return gloss;
        }
      }
    },
  });

  const text = textQuery.data ?? ``;
  const charCount = useMemo(() => splitCharacters(text).length, [text]);

  return (
    <AnswerButton
      onPress={handlePress}
      state={selected ? `selected` : `default`}
      className="flex-1"
      textClassName={choiceButtonText({
        length:
          charCount <= 5
            ? `tiny`
            : charCount <= 20
              ? `short`
              : charCount <= 40
                ? `medium`
                : `long`,
        className: choice.type === `hanzi` ? `font-normal` : undefined,
      })}
    >
      {text}
    </AnswerButton>
  );
};

const choiceButtonText = tv({
  // px-1: Horizontal padding is necessary to give first and last letters on a
  // line with accents enough space to not be clipped. Without this words like
  // "lǐ" will have half the accent clipped.
  base: `px-1`,
  variants: {
    length: {
      tiny: `text-xl/tight lg:text-2xl/tight`,
      short: `text-lg/tight lg:text-xl/tight`,
      medium: `lg:text-lg/tight`,
      long: `text-xs lg:text-md/tight`,
    },
  },
});
