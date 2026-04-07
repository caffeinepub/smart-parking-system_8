import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ParkingSlot,
  UserProfile,
  UserRole,
  VehicleType,
} from "../backend";
import { useActor } from "./useActor";

export function useIncomeStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["incomeStats"],
    queryFn: async () => {
      if (!actor) return { dailyIncome: 0n, monthlyIncome: 0n };
      return actor.getIncomeStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllParkingSessions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useAvailableSlots() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["availableSlots"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableSlots();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useCustomerSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customerSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomerSessions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function usePricing() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      if (!actor) return [0n, 0n] as [bigint, bigint];
      return actor.getPricing();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

export function useAddSlot() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      vehicleType,
    }: { name: string; vehicleType: VehicleType | null }) => {
      if (!actor) throw new Error("No actor");
      return actor.addOrUpdateParkingSlot(name, vehicleType);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availableSlots"] }),
  });
}

export function useRemoveSlot() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: number) => {
      if (!actor) throw new Error("No actor");
      return actor.removeParkingSlot(slotId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availableSlots"] }),
  });
}

export function useSetPricing() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ two, four }: { two: bigint; four: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.setPricing(two, four);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing"] }),
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: { principal: Principal; role: UserRole }) => {
      if (!actor) throw new Error("No actor");
      return actor.assignCallerUserRole(principal, role);
    },
  });
}

export function useRegisterSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slotId,
      vehicleNumber,
      vehicleType,
    }: {
      slotId: number;
      vehicleNumber: string;
      vehicleType: VehicleType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.registerParkingSession(slotId, vehicleNumber, vehicleType);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customerSessions"] });
      qc.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}

export function useFinalizeSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.finalizeParkingSession(sessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customerSessions"] });
      qc.invalidateQueries({ queryKey: ["availableSlots"] });
      qc.invalidateQueries({ queryKey: ["allSessions"] });
      qc.invalidateQueries({ queryKey: ["incomeStats"] });
    },
  });
}
