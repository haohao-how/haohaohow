import type { SkillReviewQueue } from "@/data/skills";
import { Text, View } from "react-native";
import { tv } from "tailwind-variants";
import { IconImage } from "./IconImage";

export function QuizQueueButton({
  queueStats,
}: {
  queueStats: Pick<
    SkillReviewQueue,
    `overDueCount` | `dueCount` | `newCount`
  > | null;
}) {
  return (
    <View
      className={`
        relative size-[32px] flex-row justify-center

        md:justify-start
      `}
    >
      <IconImage
        size={32}
        className="self-center text-foreground"
        source={require(`@/assets/icons/inbox-filled.svg`)}
      />
      {queueStats == null ? null : queueStats.overDueCount > 0 ? (
        <CountLozenge count={queueStats.overDueCount} mode="overdue" />
      ) : queueStats.dueCount > 0 ? (
        <CountLozenge count={queueStats.dueCount} mode="due" />
      ) : queueStats.newCount > 0 ? (
        <CountLozenge count={queueStats.newCount} mode="new" />
      ) : (
        <CheckBadge />
      )}
    </View>
  );
}

function CheckBadge() {
  return (
    <View className="absolute left-[55%] top-[62%] size-quiz-px rounded-full bg-background p-[2px]">
      <IconImage
        size={12}
        className="self-center rounded-full bg-foreground/30 text-foreground"
        source={require(`@/assets/icons/check.svg`)}
      />
    </View>
  );
}

function CountLozenge({
  count,
  mode,
  className,
}: {
  count: number;
  mode: `overdue` | `due` | `new`;
  className?: string;
}) {
  const countText = count >= 100 ? `99+` : `${count}`;
  return (
    <View className={countLozengePillClass({ mode, className })}>
      <Text className="text-[10px] font-bold text-background">{countText}</Text>
    </View>
  );
}

const countLozengePillClass = tv({
  base: `
    absolute left-[52%] top-[60%] flex h-[20px] min-w-[20px] items-center justify-center
    rounded-full border-2 border-solid border-background px-[4px]
  `,
  variants: {
    mode: {
      overdue: `bg-red-9`,
      due: `bg-cyan-10`,
      new: `bg-lime-10`,
    },
  },
  defaultVariants: {
    mode: `overdue`,
  },
});
