import { useQuery } from "@tanstack/react-query";
import { fetchExperiments } from "@/api/experiments";

export function useExperiments(filter = "") {
  return useQuery({
    queryKey: ["experiments", filter],
    queryFn: () => fetchExperiments({ filter, perPage: 100 }),
  });
}
