import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export interface ParkingSlot {
    id: SlotId;
    vehicleType?: VehicleType;
    name: string;
    isOccupied: boolean;
}
export type SlotId = number;
export interface ParkingSession {
    exitTime?: EpochTime;
    vehicleType: VehicleType;
    entryTime: EpochTime;
    vehicleNumber: string;
    totalCost?: bigint;
    slotId: SlotId;
    customerId: UserId;
}
export type ParkingSessionId = string;
export interface UserProfile {
    vehicleType: VehicleType;
    username: string;
    vehicleNumber: string;
}
export type EpochTime = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleType {
    twoWheeler = "twoWheeler",
    fourWheeler = "fourWheeler"
}
export interface backendInterface {
    addOrUpdateParkingSlot(slotName: string, vehicleType: VehicleType | null): Promise<SlotId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    finalizeParkingSession(sessionId: ParkingSessionId): Promise<ParkingSession>;
    getAllParkingSessions(): Promise<Array<ParkingSession>>;
    getAvailableSlots(): Promise<Array<ParkingSlot>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerSessions(): Promise<Array<ParkingSession>>;
    getIncomeStats(): Promise<{
        dailyIncome: bigint;
        monthlyIncome: bigint;
    }>;
    getLatestVehicleNumber(): Promise<string | null>;
    getParkingSession(sessionId: ParkingSessionId): Promise<ParkingSession | null>;
    getPricing(): Promise<[bigint, bigint]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerParkingSession(slotId: SlotId, vehicleNumber: string, vehicleType: VehicleType): Promise<ParkingSessionId>;
    removeParkingSlot(slotId: SlotId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPricing(twoWheelerRate: bigint, fourWheelerRate: bigint): Promise<void>;
}
