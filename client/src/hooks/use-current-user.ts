import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  const {
    isLoading,
    data: user,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        console.log("fetching current user");
        const response = await api.get("/auth/current-user");
        return response.data;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
  });

  return { isLoading, user, isError };
};
