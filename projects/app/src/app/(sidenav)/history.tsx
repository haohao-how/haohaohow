import {
  useReplicache,
  useReplicacheSubscribe,
} from "@/components/ReplicacheContext";
import { Rating } from "@/util/fsrs";
import reverse from "lodash/reverse";
import sortBy from "lodash/sortBy";
import { ScrollView, Text, View } from "react-native";

export default function HistoryPage() {
  const start = Date.now();
  const db = useReplicache();

  const data = useReplicacheSubscribe(async (tx) => {
    const result = [];
    for await (const [key, value] of db.query.skillState.byDue(tx)) {
      result.push([key, value] as const);
      if (result.length >= 50) {
        break;
      }
    }
    return result;
  });

  const skillReviews = useReplicacheSubscribe(async (tx) =>
    Array.fromAsync(db.query.skillReview.scan(tx)).then((reviews) =>
      reverse(sortBy(reviews, (x) => x[0].when.getTime())),
    ),
  );

  const renderTime = Date.now() - start;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pt-safe-offset-4 px-safe-or-4 items-center gap-[10px] padding-[10px]"
    >
      <View className="flex-row gap-2">
        <View>
          <Text className="text-text">
            Render time {Math.round(renderTime)}ms
          </Text>
        </View>
        <View className="flex-1 items-center gap-[10px]">
          <Text className="text-xl text-text">upcoming</Text>

          {data?.map(([key, value], i) => (
            <View key={i}>
              <Text className="text-text">
                {key.skill.hanzi}: {value.due.toISOString()}
              </Text>
            </View>
          ))}
        </View>

        <View>
          <Text className="self-center text-xl text-text">history</Text>

          {skillReviews?.map(([key, value], i) => (
            <View key={i}>
              <Text className="text-text">
                {value.rating === Rating.Again
                  ? `❌`
                  : value.rating === Rating.Good
                    ? `✅`
                    : value.rating}
                {` `}
                {key.skill.hanzi}: {key.when.toISOString()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
